import React, { Component, useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import styles from './ThreeFrame.module.scss'
import spinner from './../water-spin.svg'

// import cannon from './Images/cannon.jpg'

// import HDRI from './../Images/kiara_5_noon.jpg'
import { TextureLoader, XRTransientInputHitTestResult } from "three";

interface IThreeFrameProps {
    modelPaths: string[];
    HDRI: string;
}

export const ThreeFrame: React.FC<IThreeFrameProps> = ({modelPaths, HDRI, ...props}: IThreeFrameProps) => {
    // the target div for everything
    const mount = useRef(document.createElement('div'));

    const scene = useRef<THREE.Scene>();
    const camera = useRef<THREE.PerspectiveCamera>();
    const controls = useRef<OrbitControls>();
    const requestID = useRef<number>();
    const renderer = useRef<THREE.WebGLRenderer>();
    const clock = useRef<THREE.Clock>();
    const mixer = useRef<THREE.AnimationMixer>();

    // loader stuff
    const loader = useRef<GLTFLoader>();
    const manager = useRef<THREE.LoadingManager>();
    const textureLoader = useRef<THREE.TextureLoader>();
    const [percentLoaded, setPercentLoaded] = useState<number>(0);
    const [loaded, setLoaded] = useState<boolean>(false);
    // const modelPaths = useRef<string[]>([
    //     // '/Models/Blender/untitled9.glb',
    //     // `${process.env.PUBLIC_URL}/Models/Blender/bones/street.glb`,
    //     // `${process.env.PUBLIC_URL}/Models/Blender/bones/tree2.glb`,
    //     // "https://bmp-assets.s3.amazonaws.com/photogrammetry.glb",
    //     "https://bmp-assets.s3.amazonaws.com/leftBaseGrass.glb",
    //     // 'https://bmp-assets.s3.amazonaws.com/street.glb',
    //     "https://bmp-assets.s3.amazonaws.com/shrubFrontLeft.glb",
    //     "https://bmp-assets.s3.amazonaws.com/shrubBackLeft.glb",
    //     "https://bmp-assets.s3.amazonaws.com/tree2.glb",
    //     "https://bmp-assets.s3.amazonaws.com/tree1.glb",

    // ]);

    // lights
    const hemisphereLight = useRef<THREE.HemisphereLight>();
    const spotLight = useRef<THREE.SpotLight>();
    const ambientLight = useRef<THREE.AmbientLight>();
    const directionalLight = useRef<THREE.DirectionalLight>();
    const lightDistanceFactor = useRef<number>(1.5);

    // HDRI
    const pmremGenerator = useRef<THREE.PMREMGenerator>();
    const pngCubeRenderTarget = useRef<THREE.WebGLRenderTarget>();

    useEffect(() => {
        sceneSetup();
        addCustomSceneObjects();
        startAnimationLoop();
        window.addEventListener('resize', handleWindowResize);

        return () => {
            window.removeEventListener('resize', handleWindowResize);
            requestID.current && window.cancelAnimationFrame(requestID.current);
            controls.current && controls.current.dispose();
        }
    }, []);



    // Standard scene setup in Three.js. Check "Creating a scene" manual for more information
    // https://threejs.org/docs/#manual/en/introduction/Creating-a-scene
    const sceneSetup = () => {
        // get container dimensions and use them for scene sizing
        const width = mount.current.clientWidth;
        const height = mount.current.clientHeight;


        camera.current = new THREE.PerspectiveCamera(
            75, // fov = field of view
            width / height, // aspect ratio
            0.01, // near plane
            1000 // far plane
        );
        camera.current.position.z = 10; // is used here to set some distance from a cube that is located at z = 0
        // OrbitControls allow a camera to orbit around the object
        // https://threejs.org/docs/#examples/controls/OrbitControls
        controls.current = new OrbitControls(camera.current, mount.current);
        renderer.current = new THREE.WebGLRenderer({ alpha: true });
        renderer.current.setSize(width, height);
        renderer.current.toneMapping = THREE.ReinhardToneMapping;
        renderer.current.toneMappingExposure = 3;
        renderer.current.shadowMap.enabled = true;

        scene.current = new THREE.Scene();
        // scene.current.add(new THREE.AxesHelper(500))

        mount.current.appendChild(renderer.current.domElement); // mount using React ref
    };




    // Here should come custom code.
    // Code below is taken from Three.js BoxGeometry example
    // https://threejs.org/docs/#api/en/geometries/BoxGeometry
    const addCustomSceneObjects = () => {

        manager.current = new THREE.LoadingManager();

        manager.current.onStart = (url, itemsLoaded, itemsTotal) => {
            // console.log('Started loading file: ' + url + '.\nLoaded ' + itemsLoaded + ' of ' + itemsTotal + ' files.');
        };
        manager.current.onLoad = () => {
            console.log('Loading complete!');
            setLoaded(true)
        };
        manager.current.onProgress = (url, itemsLoaded, itemsTotal) => {
            // console.log('Loading file: ' + url + '.\nLoaded ' + itemsLoaded + ' of ' + itemsTotal + ' files.');
            setPercentLoaded(itemsLoaded / itemsTotal);

        };
        manager.current.onError = (url) => {
            console.log('There was an error loading ' + url);
        };

        // HDRI
        textureLoader.current = new THREE.TextureLoader();
        textureLoader.current && textureLoader.current.load(HDRI, function (texture) {
            if (renderer.current) {
                pmremGenerator.current = new THREE.PMREMGenerator(renderer.current);
                if (pmremGenerator.current) pmremGenerator.current.compileEquirectangularShader();
                pngCubeRenderTarget.current = pmremGenerator.current.fromEquirectangular(texture);
                if (scene.current) {
                    scene.current.background = pngCubeRenderTarget.current.texture;
                }
            }
            texture.dispose();
        }, undefined, function (e) {
            console.log(e, "TextureLoader error");
        });


        loader.current = new GLTFLoader(manager.current);

        // loader.current.load(process.env.PUBLIC_URL + '/Models/Blender/untitled9.glb', function (gltf) {
        //     gltf.scene.scale.set(10, 10, 10) // scale here
        //     // add shadows
        //     gltf.scene.traverse(_ => {
        //         if ((_ instanceof THREE.Mesh)) {
        //             _.castShadow = true;
        //             _.receiveShadow = true;
        //             if (_.material.map) _.material.map.anisotropy = 16;
        //         }
        //     })

        //     if (scene.current) scene.current.add(gltf.scene);
        // }, undefined, function (error) {
        //     console.error(error, "Errror loading GLTF");
        // });

        // loader.current.load(process.env.PUBLIC_URL + '/Models/Blender/untitled9.glb', function (gltf) {
        //     gltf.scene.scale.set(10, 10, 10) // scale here
        //     // add shadows
        //     gltf.scene.traverse(_ => {
        //         if ((_ instanceof THREE.Mesh)) {
        //             _.castShadow = true;
        //             _.receiveShadow = true;
        //             if (_.material.map) _.material.map.anisotropy = 16;
        //         }
        //     })

        //     if (scene.current) scene.current.add(gltf.scene);
        // }, undefined, function (error) {
        //     console.error(error, "Errror loading GLTF");
        // });


        const loadGLTF = (path: string) => {
            loader.current && loader.current.load(path, function (gltf) {
                let model = gltf.scene
                model.scale.set(10, 10, 10) // scale here
                // add shadows
                model.traverse(_ => {
                    if ((_ instanceof THREE.Mesh)) {
                        _.castShadow = true;
                        _.receiveShadow = true;
                        // if (_.material.map) _.material.map.anisotropy = 16;
                    }
                })

                if (scene.current) scene.current.add(gltf.scene);
            }, undefined, function (error) {
                console.error(error, `Error loading ${path}`);
            });
        }

        modelPaths.forEach(_ => loadGLTF(_));


        //       _____  
        //     .'     `.
        //    /         \
        //   |           | 
        //   '.  +^^^+  .'
        //     `. \./ .'
        //       |_|_|  
        //       (___)    
        //       (___)
        //       `---'


        // {
        ambientLight.current = new THREE.AmbientLight(0xFFFFFF, .7);
        if (scene.current) scene.current.add(ambientLight.current);


        // directionalLight.current = new THREE.DirectionalLight(0xffffff, 5);
        // directionalLight.current.position.set(50, 90, 45);

        // directionalLight.current.castShadow = true;
        // directionalLight.current.shadow.bias = -0.0001;
        // directionalLight.current.shadow.mapSize.width = 1024 * 4;
        // directionalLight.current.shadow.mapSize.height = 1024 * 4;
        // if (scene.current) scene.current.add(directionalLight.current);

        // let lightHelper = new THREE.DirectionalLightHelper(directionalLight.current)
        // if (scene.current) scene.current.add(lightHelper);











        // spotLight.current = new THREE.SpotLight(0xffa95c, 4);
        // spotLight.current = new THREE.SpotLight(0xf9e3d0, 4);
        // if (spotLight.current) spotLight.current.position.set(5 * lightDistanceFactor.current, 9 * lightDistanceFactor.current, 4.5 * lightDistanceFactor.current);
        // if (scene.current) scene.current.add(spotLight.current.target);
        // spotLight.current.castShadow = true;
        // spotLight.current.shadow.bias = -0.0001;
        // spotLight.current.shadow.mapSize.width = 1024 * 4;
        // spotLight.current.shadow.mapSize.height = 1024 * 4;
        // if (scene.current) scene.current.add(spotLight.current);

        // let newlightHelper = new THREE.SpotLightHelper(spotLight.current);
        // if (scene.current) scene.current.add(newlightHelper);








        let hemiLight = new THREE.HemisphereLight(0xffffff, 0xffffff, 0.3);
        hemiLight.color.setHSL(0.6, 1, 0.6);
        hemiLight.groundColor.setHSL(0.095, 1, 0.75);
        hemiLight.position.set(0, 50, 0);
        if (scene.current) scene.current.add(hemiLight);

        // let hemiLightHelper = new THREE.HemisphereLightHelper(hemiLight, 10);
        // if (scene.current) scene.current.add(hemiLightHelper);





















        // https://threejs.org/examples/#webgl_lights_hemisphere
        let dirLight = new THREE.DirectionalLight(0xffffff, .8);
        dirLight.color.setHSL(0.1, 1, 0.95);
        dirLight.position.set(1, 1.8, .9);
        dirLight.position.multiplyScalar(30);
        if (scene.current) scene.current.add(dirLight);

        dirLight.castShadow = true;

        dirLight.shadow.mapSize.width = 2048;
        dirLight.shadow.mapSize.height = 2048;

        var d = 50;

        dirLight.shadow.camera.left = - d;
        dirLight.shadow.camera.right = d;
        dirLight.shadow.camera.top = d;
        dirLight.shadow.camera.bottom = - d;

        dirLight.shadow.camera.far = 3500;
        dirLight.shadow.bias = - 0.0001;

        // let dirLightHelper = new THREE.DirectionalLightHelper(dirLight, 10);
        // if (scene.current) scene.current.add(dirLightHelper);





        // }

        //       _____  
        //     .'     `.
        //    /         \
        //   |           |                             
        //   '.  +^^^+  .'
        //     `. \./ .'
        //       |_|_|  
        //       (___)    
        //       (___)
        //       `---'


    };







    const handleWindowResize = () => {
        const width = mount.current.clientWidth;
        const height = mount.current.clientHeight;

        renderer.current && renderer.current.setSize(width, height);
        if (camera.current) camera.current.aspect = width / height;

        // Note that after making changes to most of camera properties you have to call
        // .updateProjectionMatrix for the changes to take effect.
        camera.current && camera.current.updateProjectionMatrix();
    };

    const startAnimationLoop = () => {

        requestID.current = requestAnimationFrame(animate);
    };

    // https://sbcode.net/threejs/gltf-animation/
    clock.current = new THREE.Clock()

    // https://medium.com/swlh/building-a-3d-interactive-with-react-and-threejs-70dfd212bf67
    // const animate = () => {
    //     requestID.current = window.requestAnimationFrame(animate);
    //     if (controls.current) controls.current.update();
    //     if (mixer.current && clock.current) mixer.current.update(clock.current.getDelta());
    //     (renderer.current && scene.current && camera.current) && renderer.current.render(scene.current, camera.current);
    // };

    // https://medium.com/swlh/building-a-3d-interactive-with-react-and-threejs-70dfd212bf67
    const animate = () => {
        requestID.current = window.requestAnimationFrame(animate);
        if (controls.current) controls.current.update();
        if (mixer.current && clock.current) mixer.current.update(clock.current.getDelta());
        (renderer.current && scene.current && camera.current) && renderer.current.render(scene.current, camera.current);
        // if (spotLight.current) spotLight.current.position.set(50*lightDistanceFactor.current, 90*lightDistanceFactor.current, 45*lightDistanceFactor.current);
        // if (directionalLight.current) directionalLight.current.position.set(5*lightDistanceFactor.current, 9*lightDistanceFactor.current, 4.5*lightDistanceFactor.current);


        // this.renderScene();  //perform animation/shader updates here
    };


    return (
        <div className={styles.root}>
            { !loaded && <div className={styles.loading}>
                <p>{(percentLoaded * 100).toFixed(0)}%</p>
                {/* <img src={spinner} alt=""/> */}
            </div>}
            <div className={styles.root}
                style={{
                    width: '100vw',
                    height: "100vh",
                    visibility: `${loaded ? "visible" : "hidden"}`
                } as React.CSSProperties} ref={mount} />
        </div>
    )
}

