import { TextureLoader } from 'three';
import { useLoader } from '@react-three/fiber';

// Using high-quality standard textures from reliable CDNs
export const useEarthTextures = () => {
    const [colorMap, normalMap, specularMap, cloudsMap, lightsMap] = useLoader(TextureLoader, [
        '/textures/Earth.webp', // Local high-res texture
        '/textures/earth-topology.png',
        '/textures/earth-water.png',
        '/textures/earth-clouds.png',
        '/textures/earth-night.jpg',
    ]);

    return { colorMap, normalMap, specularMap, cloudsMap, lightsMap };
};
