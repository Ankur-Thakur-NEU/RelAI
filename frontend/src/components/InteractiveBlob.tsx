'use client';

import React, { useEffect, useRef } from 'react';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
interface ThreeJS {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Scene: new () => any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  PerspectiveCamera: new (fov: number, aspect: number, near: number, far: number) => any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  WebGLRenderer: new (options: any) => any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  SphereGeometry: new (radius: number, widthSegments: number, heightSegments: number) => any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  MeshBasicMaterial: new (options: any) => any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ShaderMaterial: new (options: any) => any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Mesh: new (geometry: any, material: any) => any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Color: new (color: string | number) => any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Vector2: new (x: number, y: number) => any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Clock: new () => any;
  MathUtils: {
    lerp: (a: number, b: number, t: number) => number;
  };
  FrontSide: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Camera: new (...args: any[]) => any;
}

interface InteractiveBlobProps {
  className?: string;
}

const InteractiveBlob: React.FC<InteractiveBlobProps> = ({ className = '' }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneRef = useRef<unknown>(null);
  const cameraRef = useRef<unknown>(null);
  const rendererRef = useRef<unknown>(null);
  const blobRef = useRef<unknown>(null);
  const mouseRef = useRef({ x: 0, y: 0 });
  const mouseTargetRef = useRef({ x: 0, y: 0 });
  const animationFrameRef = useRef<number | undefined>(undefined);
  const isInitializedRef = useRef<boolean>(false);

  useEffect(() => {
    let isMounted = true;

    // Dynamically import Three.js to avoid SSR issues
    const loadThreeJS = async () => {
      if (typeof window === 'undefined') return;

      // Load Three.js from CDN
      await new Promise<void>((resolve, reject) => {
        if ((window as unknown as { THREE?: unknown }).THREE) {
          resolve();
          return;
        }

        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
        script.onload = () => resolve();
        script.onerror = () => reject(new Error('Failed to load Three.js'));
        document.head.appendChild(script);
      });

      // Only initialize if component is still mounted
      if (isMounted) {
        initBlob();
      }
    };

    const initBlob = () => {
      if (!canvasRef.current || !(window as unknown as { THREE?: unknown }).THREE || isInitializedRef.current) return;

      const THREE = (window as unknown as { THREE: ThreeJS }).THREE;
      const canvas = canvasRef.current;

      try {
        // Scene setup
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(75, canvas.offsetWidth / canvas.offsetHeight, 0.1, 1000);
        const renderer = new THREE.WebGLRenderer({ 
          canvas,
          antialias: true,
          alpha: true,
          powerPreference: "high-performance",
          precision: "highp"
        });
        
        renderer.setSize(canvas.offsetWidth, canvas.offsetHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // Higher quality rendering
        renderer.setClearColor(0x000000, 0);
        
        // Create blob geometry - higher resolution to prevent pixelation
        const geometry = new THREE.SphereGeometry(4.5, 256, 256);
        
        // Store references
        sceneRef.current = scene;
        cameraRef.current = camera;
        rendererRef.current = renderer;
        
        // Vertex shader
        const vertexShader = `
          varying vec3 vPosition;
          varying vec3 vNormal;
          varying vec3 vWorldPosition;
          varying vec3 vViewPosition;
          uniform float time;
          uniform vec2 mouse;
          
          void main() {
            vec3 pos = position;
            
            // Create organic blob deformation - slower and smoother
            float noise1 = sin(pos.x * 1.2 + time * 0.4 + mouse.x * 0.8) * 
                          cos(pos.y * 1.4 + time * 0.6 + mouse.y * 0.8) * 
                          sin(pos.z * 1.0 + time * 0.3) * 0.2;
            
            float noise2 = sin(pos.x * 2.0 + time * 0.7 + mouse.x * 0.6) * 
                          cos(pos.y * 1.8 + time * 0.5 + mouse.y * 0.6) * 0.15;
            
            // Subtle mouse interaction for shape variation - no position movement
            vec3 mouseInfluence = normal * (mouse.x * mouse.y * 0.1);
            pos += mouseInfluence;
            
            // Apply noise deformation
            pos += normal * (noise1 + noise2);
            
            vec4 worldPosition = modelMatrix * vec4(pos, 1.0);
            vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
            
            vPosition = pos;
            vNormal = normalize(normalMatrix * normal);
            vWorldPosition = worldPosition.xyz;
            vViewPosition = mvPosition.xyz;
            
            gl_Position = projectionMatrix * mvPosition;
          }
        `;
        
        // Fragment shader with reduced color coverage
        const fragmentShader = `
          varying vec3 vPosition;
          varying vec3 vNormal;
          varying vec3 vWorldPosition;
          varying vec3 vViewPosition;
          uniform float time;
          uniform vec2 mouse;
          
          void main() {
            vec3 normal = normalize(vNormal);
            vec3 viewDir = normalize(-vViewPosition);
            
            // Calculate fresnel for edge detection - more extreme curve for thinner edges
            float fresnel = 1.0 - max(0.0, dot(normal, viewDir));
            fresnel = pow(fresnel, 4.0); // Increased from 2.5 to 4.0 for thinner color bands
            
            // Calculate angle around the blob for gradient positioning
            vec3 pos = vWorldPosition;
            float angle = atan(pos.y, pos.x);
            float normalizedAngle = (angle + 3.14159) / (2.0 * 3.14159);
            
            // Animate the gradient rotation - slower
            float rotatedAngle = normalizedAngle + time * 0.05;
            rotatedAngle = mod(rotatedAngle, 1.0);
            
            // Define the gradient colors exactly like in the image
            vec3 orange = vec3(1.0, 0.5, 0.1);
            vec3 yellow = vec3(1.0, 0.9, 0.2);
            vec3 green = vec3(0.3, 1.0, 0.4);
            vec3 cyan = vec3(0.2, 0.9, 1.0);
            vec3 blue = vec3(0.2, 0.5, 1.0);
            vec3 purple = vec3(0.7, 0.3, 1.0);
            
            vec3 edgeColor;
            if (rotatedAngle < 0.16667) {
              edgeColor = mix(orange, yellow, rotatedAngle * 6.0);
            } else if (rotatedAngle < 0.33333) {
              edgeColor = mix(yellow, green, (rotatedAngle - 0.16667) * 6.0);
            } else if (rotatedAngle < 0.5) {
              edgeColor = mix(green, cyan, (rotatedAngle - 0.33333) * 6.0);
            } else if (rotatedAngle < 0.66667) {
              edgeColor = mix(cyan, blue, (rotatedAngle - 0.5) * 6.0);
            } else if (rotatedAngle < 0.83333) {
              edgeColor = mix(blue, purple, (rotatedAngle - 0.66667) * 6.0);
            } else {
              edgeColor = mix(purple, orange, (rotatedAngle - 0.83333) * 6.0);
            }
            
            // Create the main blob - darker center
            vec3 blobColor = vec3(0.02, 0.02, 0.02); // Darker than before
            
            // Apply the colored glow to the edges using fresnel - reduced intensity
            vec3 glowColor = edgeColor * fresnel * 1.5; // Reduced from 2.0 to 1.5
            
            // Add outer glow effect - more concentrated
            float outerGlow = pow(fresnel, 2.5) * 1.2; // More concentrated glow
            vec3 outerGlowColor = edgeColor * outerGlow;
            
            // Combine blob, inner glow, and outer glow
            vec3 finalColor = blobColor + glowColor + outerGlowColor;
            
            // Make the center stay much darker - stronger mask
            float centerMask = 1.0 - fresnel;
            finalColor = mix(finalColor, blobColor, centerMask * 0.8); // Increased from 0.6 to 0.8
            
            // Calculate alpha - solid blob with thinner glowing edges
            float alpha = 0.95 + fresnel * 0.4 + outerGlow * 0.2; // Reduced edge alpha contribution
            
            gl_FragColor = vec4(finalColor, alpha);
          }
        `;
        
        const material = new THREE.ShaderMaterial({
          vertexShader,
          fragmentShader,
          uniforms: {
            time: { value: 0 },
            mouse: { value: new THREE.Vector2(0, 0) }
          },
          transparent: true,
          side: THREE.FrontSide
        });
        
        const blob = new THREE.Mesh(geometry, material);
        scene.add(blob);
        
        camera.position.z = 8; // Moved camera closer for larger appearance
        
        // Store blob reference
        blobRef.current = blob;
        
        // Wait a frame to ensure all Three.js objects are fully initialized
        requestAnimationFrame(() => {
          if (isMounted) {
            isInitializedRef.current = true;
            animate();
          }
        });

      } catch (error) {
        console.error('Error initializing blob:', error);
      }
    };

    const animate = () => {
      // More thorough checks to ensure Three.js objects are properly initialized
      if (!isMounted || 
          !isInitializedRef.current ||
          !blobRef.current || 
          !rendererRef.current || 
          !sceneRef.current || 
          !cameraRef.current ||
          !(window as unknown as { THREE?: unknown }).THREE) {
        return;
      }

      // Additional check to ensure camera is a proper THREE.Camera instance
      const THREE = (window as unknown as { THREE: ThreeJS }).THREE;
      if (!(cameraRef.current instanceof THREE.Camera)) {
        console.warn('Camera not properly initialized yet, skipping frame');
        if (isMounted) {
          animationFrameRef.current = requestAnimationFrame(animate);
        }
        return;
      }

      try {
        // Smooth mouse following with stronger easing for more responsive interaction
        mouseRef.current.x += (mouseTargetRef.current.x - mouseRef.current.x) * 0.12;
        mouseRef.current.y += (mouseTargetRef.current.y - mouseRef.current.y) * 0.12;
        
        // Update shader uniforms
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const blob = blobRef.current as any;
        if (blob && blob.material && blob.material.uniforms) {
          blob.material.uniforms.time.value += 0.008;
          blob.material.uniforms.mouse.value.set(mouseRef.current.x, mouseRef.current.y);
        }
        
        // Make the blob rotate more noticeably with mouse movement
        const targetRotationY = Math.atan2(mouseRef.current.x, 1) * 0.6;
        const targetRotationX = Math.atan2(-mouseRef.current.y, 1) * 0.6;
        
        // Faster rotation response
        if (blob && blob.rotation) {
          blob.rotation.y += (targetRotationY - blob.rotation.y) * 0.15;
          blob.rotation.x += (targetRotationX - blob.rotation.x) * 0.15;
        }
        
        // Keep blob centered - no position movement
        if (blob && blob.position) {
          blob.position.x = 0;
          blob.position.y = 0;
          blob.position.z = 0;
        }
        
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const renderer = rendererRef.current as any;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const scene = sceneRef.current as any;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const camera = cameraRef.current as any;
        if (renderer && scene && camera) {
          renderer.render(scene, camera);
        }
        
        if (isMounted) {
          animationFrameRef.current = requestAnimationFrame(animate);
        }
      } catch (error) {
        console.error('Error in animation loop:', error);
        // Continue animation even if there's an error
        if (isMounted) {
          animationFrameRef.current = requestAnimationFrame(animate);
        }
      }
    };

    const handleMouseMove = (event: MouseEvent) => {
      if (!canvasRef.current) return;
      
      const rect = canvasRef.current.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width;
      const y = (event.clientY - rect.top) / rect.height;
      
      mouseTargetRef.current.x = (x * 2 - 1);
      mouseTargetRef.current.y = -(y * 2 - 1);
    };

    const handleResize = () => {
      if (!rendererRef.current || !cameraRef.current || !canvasRef.current || !isInitializedRef.current) return;
      
      try {
        // Use full container dimensions and maintain high pixel ratio
        const width = canvasRef.current.offsetWidth;
        const height = canvasRef.current.offsetHeight;
        
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const renderer = rendererRef.current as any;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const camera = cameraRef.current as any;
        
        if (renderer) {
          renderer.setSize(width, height);
          renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        }
        
        // Update camera aspect ratio to match container
        if (camera) {
          camera.aspect = width / height;
          camera.updateProjectionMatrix();
        }
      } catch (error) {
        console.error('Error in resize handler:', error);
      }
    };

    // Initialize
    loadThreeJS().catch(console.error);

    // Add event listeners
    document.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      isMounted = false;
      isInitializedRef.current = false;
      
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      
      document.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      
      // Cleanup Three.js resources
      try {
        if (rendererRef.current) {
          rendererRef.current.dispose();
        }
        if (blobRef.current?.material) {
          blobRef.current.material.dispose();
        }
        if (blobRef.current?.geometry) {
          blobRef.current.geometry.dispose();
        }
      } catch (error) {
        console.error('Error during cleanup:', error);
      }
    };
  }, []);

  return (
    <div className={`w-full h-full flex items-center justify-center ${className}`}>
      <canvas
        ref={canvasRef}
        className="w-full h-full max-w-full max-h-full"
        style={{ 
          width: '100%', 
          height: '100%',
          objectFit: 'contain'
        }}
      />
    </div>
  );
};

export default InteractiveBlob;