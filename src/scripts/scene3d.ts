import * as THREE from "three";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

const section = document.querySelector<HTMLElement>(".experience");
const stage = document.querySelector<HTMLElement>(".experience-stage");
const canvas = document.querySelector<HTMLCanvasElement>("#course-canvas");
const chapters = Array.from(document.querySelectorAll<HTMLElement>(".course-chapter"));
const counter = document.querySelector<HTMLElement>("#stage-count");
const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
const narrow = window.matchMedia("(max-width: 760px)");

if (section && stage && canvas && chapters.length === 4 && !reduced.matches && !narrow.matches) {
  try {
    gsap.registerPlugin(ScrollTrigger);
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: "low-power" });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
    renderer.outputColorSpace = THREE.SRGBColorSpace;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
    const geometry = new THREE.PlaneGeometry(3.15, 4.73);
    const loader = new THREE.TextureLoader();
    const posterPaths = [
      "/posters/computing.webp",
      "/posters/history.webp",
      "/posters/visual-culture.webp",
      "/posters/astronomy.webp",
    ];
    const planes = posterPaths.map((path) => {
      const material = new THREE.MeshBasicMaterial({ side: THREE.DoubleSide, transparent: true });
      const plane = new THREE.Mesh(geometry, material);
      scene.add(plane);
      loader.load(path, (texture) => {
        texture.colorSpace = THREE.SRGBColorSpace;
        material.map = texture;
        material.needsUpdate = true;
        render();
      });
      return plane;
    });

    const render = () => renderer.render(scene, camera);
    const resize = () => {
      const width = stage.clientWidth;
      const height = stage.clientHeight;
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      render();
    };
    const update = (progress: number) => {
      const cursor = Math.min(3, Math.max(0, progress * 3));
      planes.forEach((plane, index) => {
        const distance = index - cursor;
        plane.position.set(distance * 2.55, Math.sin(distance * 1.2) * 0.18, -Math.abs(distance) * 2.35);
        plane.rotation.set(0, -distance * 0.3, distance * 0.075);
        const scale = 1.02 - Math.min(Math.abs(distance), 3) * 0.13;
        plane.scale.setScalar(scale);
      });
      camera.position.set(Math.sin(progress * Math.PI * 2) * 0.18, Math.sin(progress * Math.PI) * 0.12, 8 - progress * 0.7);
      camera.lookAt(0, 0, 0);
      const active = Math.round(cursor);
      chapters.forEach((chapter, index) => chapter.classList.toggle("is-active", index === active));
      if (counter) counter.textContent = String(active + 1).padStart(2, "0");
      render();
    };

    document.documentElement.classList.add("has-webgl");
    resize();
    update(0);
    window.addEventListener("resize", resize, { passive: true });
    canvas.addEventListener("webglcontextlost", () => document.documentElement.classList.add("no-webgl"));
    ScrollTrigger.create({
      trigger: section,
      start: "top top",
      end: "bottom bottom",
      scrub: true,
      onUpdate: (self) => update(self.progress),
    });
    gsap.to(".hero-art", { yPercent: 5, ease: "none", scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true } });
    gsap.from(".hero-poster", { y: 70, opacity: 0, rotate: 0, duration: 1.1, stagger: 0.1, ease: "power3.out" });
  } catch {
    document.documentElement.classList.add("no-webgl");
  }
} else {
  document.documentElement.classList.add("no-webgl");
}
