import React, { useEffect, useRef } from 'react';
import { HeartHandshake, Zap } from 'lucide-react';

declare global {
  interface Window {
    THREE?: any;
  }
}

export const RibbonStage: React.FC = () => {
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    let frame = 0;
    let renderer: any;
    let geometry: any;
    let material: any;
    let shadow: any;
    let resizeObserver: ResizeObserver | undefined;
    let removeListeners = () => {};
    const host = hostRef.current;
    if (!host) return;

    const showFallback = () => {
      if (!cancelled) host.classList.add('ks-ribbon-fallback');
    };

    const init = () => {
      if (cancelled || !window.THREE) return;

      try {
        const THREE = window.THREE;
        const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 100);
        renderer = new THREE.WebGLRenderer({
          alpha: true,
          antialias: window.devicePixelRatio < 1.5,
          powerPreference: 'low-power',
        });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
        renderer.setClearColor(0x000000, 0);
        if ('outputColorSpace' in renderer) renderer.outputColorSpace = THREE.SRGBColorSpace;
        else renderer.outputEncoding = THREE.sRGBEncoding;
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.08;
        renderer.domElement.className = 'ks-three-ribbon-canvas';
        renderer.domElement.setAttribute('aria-hidden', 'true');
        host.prepend(renderer.domElement);

        scene.add(new THREE.HemisphereLight(0xffffff, 0xcbd2cf, 1.05));
        const keyLight = new THREE.DirectionalLight(0xffffff, 1.2);
        keyLight.position.set(3, 5, 7);
        scene.add(keyLight);
        const roseLight = new THREE.DirectionalLight(0xe6a0c4, 0.48);
        roseLight.position.set(-5, -2, 4);
        scene.add(roseLight);
        const blueLight = new THREE.DirectionalLight(0xb5c9ed, 0.4);
        blueLight.position.set(5, 1, -4);
        scene.add(blueLight);

        const ribbon = new THREE.Group();
        scene.add(ribbon);
        const count = 144;
        geometry = new THREE.BoxGeometry(0.074, 1.52, 0.34);
        material = new THREE.MeshPhysicalMaterial({
          color: 0xffffff,
          roughness: 0.29,
          metalness: 0.1,
          clearcoat: 0.8,
          clearcoatRoughness: 0.22,
        });
        const slats = new THREE.InstancedMesh(geometry, material, count);
        slats.instanceMatrix.setUsage(THREE.DynamicDrawUsage);

        const palette = ['#d9789f', '#e8a0b6', '#bd83bd', '#8e91c8', '#7cadd0', '#9bc9c1']
          .map((value: string) => new THREE.Color(value));
        const color = new THREE.Color();
        for (let index = 0; index < count; index += 1) {
          const position = (index / (count - 1)) * (palette.length - 1);
          const paletteIndex = Math.floor(position);
          color.copy(palette[paletteIndex]).lerp(
            palette[Math.min(paletteIndex + 1, palette.length - 1)],
            position - paletteIndex,
          );
          slats.setColorAt(index, color);
        }
        ribbon.add(slats);

        shadow = new THREE.Mesh(
          new THREE.PlaneGeometry(10.8, 2.8),
          new THREE.MeshBasicMaterial({
            color: 0x53616d,
            transparent: true,
            opacity: 0.075,
            depthWrite: false,
          }),
        );
        shadow.rotation.x = -Math.PI / 2;
        shadow.position.set(0, -1.4, -0.15);
        ribbon.add(shadow);

        const pointer = { x: 0, y: 0, smoothX: 0, smoothY: 0, pulse: 0 };
        let scrollProgress = 0;

        const onPointerMove = (event: PointerEvent) => {
          if (reducedMotion) return;
          const rect = host.getBoundingClientRect();
          const inside = event.clientX >= rect.left && event.clientX <= rect.right
            && event.clientY >= rect.top && event.clientY <= rect.bottom;
          pointer.x = inside ? ((event.clientX - rect.left) / Math.max(1, rect.width) - 0.5) * 2 : 0;
          pointer.y = inside ? -((event.clientY - rect.top) / Math.max(1, rect.height) - 0.5) * 2 : 0;
        };

        const onPointerDown = (event: PointerEvent) => {
          if (reducedMotion) return;
          const rect = host.getBoundingClientRect();
          if (event.clientX >= rect.left && event.clientX <= rect.right
            && event.clientY >= rect.top && event.clientY <= rect.bottom) {
            pointer.pulse = 1;
          }
        };

        const onScroll = () => {
          const rect = host.getBoundingClientRect();
          scrollProgress = Math.max(-1, Math.min(
            1,
            (window.innerHeight * 0.62 - rect.top) / (window.innerHeight + rect.height),
          ));
        };

        window.addEventListener('pointermove', onPointerMove, { passive: true });
        window.addEventListener('pointerdown', onPointerDown, { passive: true });
        window.addEventListener('scroll', onScroll, { passive: true });
        onScroll();

        const clock = new THREE.Clock();
        const dummy = new THREE.Object3D();

        const draw = (time: number) => {
          if (cancelled) return;
          const mobile = host.clientWidth < 640;
          pointer.smoothX += (pointer.x - pointer.smoothX) * 0.075;
          pointer.smoothY += (pointer.y - pointer.smoothY) * 0.075;
          pointer.pulse *= 0.92;

          ribbon.position.set(mobile ? 0.25 : 0.7, (mobile ? -0.72 : 0.12) + scrollProgress * 0.2, 0);
          ribbon.rotation.set(
            0.13 + pointer.smoothY * 0.12 + scrollProgress * 0.07,
            pointer.smoothX * 0.16,
            pointer.smoothX * -0.025,
          );
          ribbon.scale.set(mobile ? 0.52 : 1, mobile ? 0.76 : 1, 1);

          for (let index = 0; index < count; index += 1) {
            const u = index / (count - 1);
            const x = (u - 0.5) * 10.3;
            const distance = Math.abs(u - (pointer.smoothX * 0.5 + 0.5));
            const bump = Math.exp(-distance * distance * 22) * (0.22 + pointer.pulse * 0.42);
            const phase = u * Math.PI * 2.35 - time * 0.9;
            const wave = Math.sin(phase) * 0.58
              + Math.cos(u * Math.PI * 1.2 + time * 0.5) * 0.18
              + bump;
            const depth = Math.cos(phase) * 0.62;

            dummy.position.set(x, wave, depth);
            dummy.rotation.set(
              Math.sin(u * Math.PI * 2.6 - time * 0.9) * 0.78 + pointer.smoothY * 0.24,
              Math.cos(u * Math.PI * 1.8 - time * 0.7) * 0.42,
              Math.sin(u * Math.PI * 2 - time * 0.8) * 0.13,
            );
            dummy.scale.set(1, 0.88 + 0.22 * Math.sin(u * Math.PI) + bump * 0.32, 1);
            dummy.updateMatrix();
            slats.setMatrixAt(index, dummy.matrix);
          }

          slats.instanceMatrix.needsUpdate = true;
          renderer.render(scene, camera);
        };

        const resize = () => {
          const width = Math.max(1, host.clientWidth);
          const height = Math.max(1, host.clientHeight);
          const narrow = width / height < 0.9;
          camera.aspect = width / height;
          camera.position.set(0, 0.12, narrow ? 14.5 : width < 900 ? 10.5 : 9.3);
          camera.updateProjectionMatrix();
          renderer.setSize(width, height, false);
          draw(reducedMotion ? 0 : clock.getElapsedTime());
        };

        if ('ResizeObserver' in window) {
          resizeObserver = new ResizeObserver(resize);
          resizeObserver.observe(host);
        } else {
          window.addEventListener('resize', resize, { passive: true });
        }

        const animate = () => {
          if (cancelled) return;
          frame = window.requestAnimationFrame(animate);
          draw(clock.getElapsedTime());
        };

        resize();
        if (!reducedMotion) animate();

        removeListeners = () => {
          window.removeEventListener('pointermove', onPointerMove);
          window.removeEventListener('pointerdown', onPointerDown);
          window.removeEventListener('scroll', onScroll);
          window.removeEventListener('resize', resize);
        };
      } catch {
        renderer?.dispose();
        renderer?.domElement?.remove();
        geometry?.dispose();
        material?.dispose();
        shadow?.geometry?.dispose();
        shadow?.material?.dispose();
        showFallback();
      }
    };

    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
    script.async = true;
    script.dataset.kaamsetuThree = 'true';
    script.addEventListener('load', init, { once: true });
    script.addEventListener('error', showFallback, { once: true });
    document.head.appendChild(script);

    return () => {
      cancelled = true;
      window.cancelAnimationFrame(frame);
      resizeObserver?.disconnect();
      removeListeners();
      if (renderer) {
        renderer.dispose();
        renderer.domElement.remove();
      }
      geometry?.dispose();
      material?.dispose();
      shadow?.geometry?.dispose();
      shadow?.material?.dispose();
      script.remove();
    };
  }, []);

  return (
    <div ref={hostRef} className="ks-interactive-stage" aria-hidden="true">
      <div className="ks-ribbon-glow" />
      <div className="ks-ribbon-orbit ks-ribbon-orbit-a" />
      <div className="ks-ribbon-orbit ks-ribbon-orbit-b" />
      <div className="ks-ribbon-caption">
        <span>MOVE YOUR CURSOR</span>
        <span>KAAMSETU / LOCAL CONNECTIONS</span>
      </div>
      <div className="ks-ribbon-card ks-ribbon-card-top">
        <span className="ks-ribbon-card-icon"><Zap size={16} /></span>
        <span><b>Work, nearby.</b><small>Opportunities around you</small></span>
      </div>
      <div className="ks-ribbon-card ks-ribbon-card-bottom">
        <span className="ks-ribbon-card-icon"><HeartHandshake size={16} /></span>
        <span><b>People, connected.</b><small>Skills meet local needs</small></span>
      </div>
    </div>
  );
};
