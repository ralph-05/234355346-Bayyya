// GuardBeam Highway Simulation - Complete Implementation

// 1. SCENE SETUP
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x071920);
scene.fog = new THREE.FogExp2(0x071920, 0.002);

// 2. CAMERA (DRIVER'S PERSPECTIVE)
const camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000);
camera.position.set(0, 1.5, 3);

// 3. RENDERER WITH SHADOWS
const renderer = new THREE.WebGLRenderer({ 
  antialias: true,
  powerPreference: "high-performance"
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.getElementById('app').appendChild(renderer.domElement);

// 4. LIGHTING
const ambientLight = new THREE.AmbientLight(0x404040);
scene.add(ambientLight);

// 5. HIGHWAY CONSTRUCTION
function createHighway() {
  const highway = new THREE.Group();
  
  // Road Surface
  const road = new THREE.Mesh(
    new THREE.PlaneGeometry(200, 20),
    new THREE.MeshStandardMaterial({ 
      color: 0x333333,
      roughness: 0.8
    })
  );
  road.rotation.x = -Math.PI/2;
  road.position.y = -0.5;
  road.receiveShadow = true;
  highway.add(road);

  // Lane Markings
  for (let i = -100; i < 100; i += 15) {
    const line = new THREE.Mesh(
      new THREE.PlaneGeometry(10, 0.5),
      new THREE.MeshStandardMaterial({ 
        color: 0xffff00,
        emissive: 0xffff00,
        emissiveIntensity: 0.3
      })
    );
    line.rotation.x = -Math.PI/2;
    line.position.set(i, -0.45, 0);
    highway.add(line);
  }
  
  return highway;
}

// 6. CAR FACTORY WITH GUARDBEAM SENSORS
function createCar(color, xPos) {
  const car = new THREE.Group();

  // Main Body
  const body = new THREE.Mesh(
    new THREE.BoxGeometry(2.5, 1.5, 5),
    new THREE.MeshPhysicalMaterial({
      color: color,
      metalness: 0.9,
      roughness: 0.1,
      clearcoat: 1,
      clearcoatRoughness: 0.1
    })
  );
  body.castShadow = true;
  car.add(body);

  // Windshield with Visible Camera
  const windshield = new THREE.Mesh(
    new THREE.BoxGeometry(2.2, 0.9, 1.5),
    new THREE.MeshPhysicalMaterial({
      color: 0xaaccff,
      transmission: 0.9,
      roughness: 0.05,
      thickness: 0.5
    })
  );
  windshield.position.set(0, 0.5, 0.8);
  car.add(windshield);

  // GuardBeam Camera System (clearly visible)
  const cameraSystem = new THREE.Group();
  const cameraHousing = new THREE.Mesh(
    new THREE.BoxGeometry(0.25, 0.15, 0.1),
    new THREE.MeshStandardMaterial({ color: 0x111111 })
  );
  cameraHousing.position.set(0, 0.4, 1.0);
  
  const cameraLens = new THREE.Mesh(
    new THREE.CylinderGeometry(0.08, 0.08, 0.05, 32),
    new THREE.MeshStandardMaterial({
      color: 0xff0000,
      emissive: 0xff3333,
      emissiveIntensity: 0.7
    })
  );
  cameraLens.rotation.x = Math.PI/2;
  cameraLens.position.set(0, 0.4, 1.05);
  
  cameraSystem.add(cameraHousing, cameraLens);
  car.add(cameraSystem);

  // Infrared Sensor Array (front bumper)
  const irSensor = new THREE.Mesh(
    new THREE.BoxGeometry(0.3, 0.08, 0.12),
    new THREE.MeshStandardMaterial({
      color: 0x0066ff,
      emissive: 0x00aaff,
      emissiveIntensity: 0.5
    })
  );
  irSensor.position.set(0, -0.3, 2.2);
  car.add(irSensor);

  // Headlights with Auto-Dimming
  const headlight = new THREE.SpotLight(0xfff9e6, 1.5, 50, Math.PI/4, 0.5);
  headlight.position.set(0, 0.2, 2.0);
  headlight.target.position.set(0, 0, 10);
  headlight.castShadow = true;
  car.add(headlight, headlight.target);

  // Wheels
  const wheelGeometry = new THREE.CylinderGeometry(0.4, 0.4, 0.3, 32);
  const wheelMaterial = new THREE.MeshStandardMaterial({ color: 0x222222 });
  for (let i = 0; i < 4; i++) {
    const wheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
    wheel.rotation.z = Math.PI/2;
    wheel.position.set(
      i % 2 === 0 ? -1.0 : 1.0,
      -0.5,
      i < 2 ? -1.5 : 1.5
    );
    car.add(wheel);
  }

  car.position.x = xPos;
  return { car, headlight, cameraSystem, irSensor };
}

// 7. CREATE SCENE ELEMENTS
const highway = createHighway();
scene.add(highway);

const mainCar = createCar(0x2a75bb, 0);
const oncomingCar = createCar(0xcc0000, -3);
oncomingCar.car.position.z = -50;
scene.add(mainCar.car, oncomingCar.car);

// 8. ANIMATION LOOP WITH AUTO-DIMMING
function animate() {
  requestAnimationFrame(animate);

  // Move oncoming traffic
  oncomingCar.car.position.z += 0.5;
  if (oncomingCar.car.position.z > 20) {
    oncomingCar.car.position.z = -100;
  }

  // Auto-Dimming Logic
  const distance = oncomingCar.car.position.z;
  if (distance < 40 && distance > 0) {
    // Dim headlights when vehicle detected
    mainCar.headlight.intensity = 0.3;
    mainCar.headlight.angle = Math.PI/6;
    
    // Activate sensor indicators
    mainCar.cameraSystem.children[1].material.emissiveIntensity = 0.9;
    mainCar.irSensor.material.emissiveIntensity = 0.7;
  } else {
    // Full beam when road is clear
    mainCar.headlight.intensity = 1.5;
    mainCar.headlight.angle = Math.PI/4;
    
    // Dim sensor indicators
    mainCar.cameraSystem.children[1].material.emissiveIntensity = 0.3;
    mainCar.irSensor.material.emissiveIntensity = 0.2;
  }

  renderer.render(scene, camera);
}

// 9. WINDOW RESIZE HANDLER
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// 10. START SIMULATION
animate();