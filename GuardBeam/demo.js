// Initialize Three.js scene
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth/2/window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth/2, window.innerHeight);
document.getElementById('app').appendChild(renderer.domElement);

// Lighting setup
const ambientLight = new THREE.AmbientLight(0x404040);
scene.add(ambientLight);
const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
directionalLight.position.set(1, 1, 1);
scene.add(directionalLight);

// Create car model
const carGeometry = new THREE.BoxGeometry(2, 1, 4);
const carMaterial = new THREE.MeshPhongMaterial({ color: 0x156289 });
const car = new THREE.Mesh(carGeometry, carMaterial);
scene.add(car);

// Create other vehicle
const otherCarGeometry = new THREE.BoxGeometry(1.8, 0.9, 3.8);
const otherCarMaterial = new THREE.MeshPhongMaterial({ color: 0xcc0000 });
const otherCar = new THREE.Mesh(otherCarGeometry, otherCarMaterial);
otherCar.position.z = -10;
scene.add(otherCar);

// Camera controls
const controls = new THREE.OrbitControls(camera, renderer.domElement);
camera.position.set(0, 3, 8);
controls.enableDamping = true;
controls.dampingFactor = 0.05;

// Night mode toggle
let nightMode = false;
document.getElementById('nightToggle').addEventListener('click', () => {
  nightMode = !nightMode;
  document.body.classList.toggle('night-mode');
  document.getElementById('nightToggle').innerHTML = nightMode 
    ? '<i class="fas fa-sun mr-2"></i>Day Mode' 
    : '<i class="fas fa-moon mr-2"></i>Night Mode';
});

// Simulation variables
let approachSpeed = 0.1;
let distance = 10;

// Animation loop
function animate() {
  requestAnimationFrame(animate);
  
  // Update other car position
  otherCar.position.z += approachSpeed;
  distance = 10 - otherCar.position.z;
  
  // Reset position when too close
  if (otherCar.position.z > 2) {
    otherCar.position.z = -10;
    approachSpeed = 0.05 + Math.random() * 0.15;
  }
  
  // Update dashboard
  updateDashboard();
  
  controls.update();
  renderer.render(scene, camera);
}
animate();

// Update dashboard metrics
function updateDashboard() {
  // Camera system
  const cameraDist = Math.max(0, Math.round(distance * 4));
  const cameraSpeed = Math.round(approachSpeed * 200);
  const cameraConfidence = Math.min(100, Math.round(100 - (distance * 2)));
  
  document.getElementById('cameraDistance').textContent = `${cameraDist}m`;
  document.getElementById('cameraSpeed').textContent = `${cameraSpeed}km/h`;
  document.getElementById('cameraConfidence').textContent = `${cameraConfidence}%`;
  document.getElementById('cameraBar').style.width = `${cameraConfidence}%`;
  
  // Infrared system (only active in night mode)
  const infraredActive = nightMode;
  const infraredDist = Math.max(0, Math.round(distance * 3.5));
  const infraredStrength = infraredActive ? Math.min(100, Math.round(100 - (distance * 1.5))) : 0;
  
  document.getElementById('infraredDistance').textContent = infraredActive ? `${infraredDist}m` : '--';
  document.getElementById('infraredMotion').textContent = infraredActive ? 'Detected' : 'Inactive';
  document.getElementById('infraredStrength').textContent = infraredActive ? `${infraredStrength}%` : '0%';
  document.getElementById('infraredBar').style.width = `${infraredStrength}%`;
  document.getElementById('infraredBar').style.backgroundColor = infraredActive ? '#60a5fa' : '#6b7280';
  
  // Update alerts
  const alertsContainer = document.getElementById('alerts');
  alertsContainer.innerHTML = '';
  
  if (distance < 4) {
    const timeToImpact = (distance / approachSpeed).toFixed(1);
    const alert = document.createElement('div');
    alert.className = 'p-2 bg-red-900 rounded flex items-start';
    alert.innerHTML = `
      <i class="fas fa-exclamation-circle text-red-400 mt-1 mr-2"></i>
      <div>
        <p class="font-medium">Collision warning!</p>
        <p class="text-sm text-gray-300">Estimated time to impact: ${timeToImpact}s</p>
      </div>
    `;
    alertsContainer.appendChild(alert);
  } else if (distance < 8) {
    const alert = document.createElement('div');
    alert.className = 'p-2 bg-yellow-900 rounded flex items-start';
    alert.innerHTML = `
      <i class="fas fa-exclamation-circle text-yellow-400 mt-1 mr-2"></i>
      <div>
        <p class="font-medium">Vehicle approaching</p>
        <p class="text-sm text-gray-300">Maintain safe distance</p>
      </div>
    `;
    alertsContainer.appendChild(alert);
  }
}

// Handle window resize
window.addEventListener('resize', () => {
  const width = window.innerWidth / 2;
  const height = window.innerHeight;
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  renderer.setSize(width, height);
});