import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// Sample data
    const data = [
        { id: 1, label: 'A', embedding: [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16] },
        { id: 2, label: 'B', embedding: [16,15,14,13,12,11,10,9,8,7,6,5,4,3,2,1] },
        // ... add more data points as needed
    ];

    function reduceDimensions(data) {
        const pca = new PCA(data);
        return pca.predict(data, { nComponents: 3 });
    }

    function visualize3D(data) {
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        const renderer = new THREE.WebGLRenderer();
        renderer.setSize(window.innerWidth, window.innerHeight);
        document.body.appendChild(renderer.domElement);

        data.forEach(point => {
            const geometry = new THREE.SphereGeometry(0.1, 32, 32);
            const material = new THREE.MeshBasicMaterial({ color: 0xff0000 });
            const sphere = new THREE.Mesh(geometry, material);
            sphere.position.set(point[0], point[1], point[2]);
            scene.add(sphere);
        });

        camera.position.z = 5;

        const controls = new THREE.OrbitControls(camera, renderer.domElement);
        controls.update();

        function animate() {
            requestAnimationFrame(animate);
            controls.update();
            renderer.render(scene, camera);
        }

        animate();
    }

    const embeddingData = data.map(d => d.embedding);
    const reducedData = reduceDimensions(embeddingData);
    visualize3D(reducedData);
