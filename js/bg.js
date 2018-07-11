if (!Detector.webgl) Detector.addGetWebGLMessage();

var container, stats;

var camera, scene, renderer;

var mouseX = 0,
    mouseY = 0;

var windowHalfX = window.innerWidth / 2;
var windowHalfY = window.innerHeight / 2;

init();
animate();

function init() {

    container = document.getElementById('cables');

    camera = new THREE.PerspectiveCamera(20, window.innerWidth / window.innerHeight, 1, 10000);
    camera.position.z = 1800;

    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xffffff);

    var light = new THREE.DirectionalLight(0xffffff);
    light.position.set(0, 0, 1);
    scene.add(light);

    // shadow

    var canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;

    var context = canvas.getContext('2d');
    var gradient = context.createRadialGradient(canvas.width / 2, canvas.height / 2, 0, canvas.width / 2, canvas.height / 2, canvas.width / 2);
    gradient.addColorStop(0.1, 'rgba(210,210,210,1)');
    gradient.addColorStop(1, 'rgba(255,255,255,1)');

    context.fillStyle = gradient;
    context.fillRect(0, 0, canvas.width, canvas.height);

    var shadowTexture = new THREE.Texture(canvas);
    shadowTexture.needsUpdate = true;

    var shadowMaterial = new THREE.MeshBasicMaterial({
        map: shadowTexture
    });
    var shadowGeo = new THREE.PlaneBufferGeometry(300, 300, 1, 1);

    var shadowMesh;

    shadowMesh = new THREE.Mesh(shadowGeo, shadowMaterial);
    shadowMesh.position.y = -250;
    shadowMesh.rotation.x = -Math.PI / 2;
    scene.add(shadowMesh);

    shadowMesh = new THREE.Mesh(shadowGeo, shadowMaterial);
    shadowMesh.position.y = -250;
    shadowMesh.position.x = -400;
    shadowMesh.rotation.x = -Math.PI / 2;
    scene.add(shadowMesh);

    shadowMesh = new THREE.Mesh(shadowGeo, shadowMaterial);
    shadowMesh.position.y = -250;
    shadowMesh.position.x = 400;
    shadowMesh.rotation.x = -Math.PI / 2;
    scene.add(shadowMesh);

    var faceIndices = ['a', 'b', 'c'];

    var color, f, f2, f3, p, vertexIndex,

        radius = 200,

        geometry = new THREE.IcosahedronGeometry(radius, 1),
        geometry2 = new THREE.IcosahedronGeometry(radius, 1),
        geometry3 = new THREE.IcosahedronGeometry(radius, 1);

    for (var i = 0; i < geometry.faces.length; i++) {

        f = geometry.faces[i];
        f2 = geometry2.faces[i];
        f3 = geometry3.faces[i];

        for (var j = 0; j < 3; j++) {

            vertexIndex = f[faceIndices[j]];

            p = geometry.vertices[vertexIndex];

            color = new THREE.Color(0xffffff);
            color.setHSL((p.y / radius + 1) / 2, 1.0, 0.5);

            f.vertexColors[j] = color;

            color = new THREE.Color(0xffffff);
            color.setHSL(0.0, (p.y / radius + 1) / 2, 0.5);

            f2.vertexColors[j] = color;

            color = new THREE.Color(0xffffff);
            color.setHSL(0.125 * vertexIndex / geometry.vertices.length, 1.0, 0.5);

            f3.vertexColors[j] = color;

        }

    }

    var mesh, wireframe;

    var material = new THREE.MeshPhongMaterial({
        color: 0xffffff,
        flatShading: true,
        vertexColors: THREE.VertexColors,
        shininess: 0
    });
    var wireframeMaterial = new THREE.MeshBasicMaterial({
        color: 0x000000,
        wireframe: true,
        transparent: true
    });

    mesh = new THREE.Mesh(geometry, material);
    wireframe = new THREE.Mesh(geometry, wireframeMaterial);
    mesh.add(wireframe);
    mesh.position.x = -400;
    mesh.rotation.x = -1.87;
    scene.add(mesh);

    mesh = new THREE.Mesh(geometry2, material);
    wireframe = new THREE.Mesh(geometry2, wireframeMaterial);
    mesh.add(wireframe);
    mesh.position.x = 400;
    scene.add(mesh);

    mesh = new THREE.Mesh(geometry3, material);
    wireframe = new THREE.Mesh(geometry3, wireframeMaterial);
    mesh.add(wireframe);
    scene.add(mesh);

    renderer = new THREE.WebGLRenderer({
        antialias: true
    });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    container.appendChild(renderer.domElement);

    stats = new Stats();
    container.appendChild(stats.dom);

    document.addEventListener('mousemove', onDocumentMouseMove, false);

    //

    window.addEventListener('resize', onWindowResize, false);

}

function onWindowResize() {

    windowHalfX = window.innerWidth / 2;
    windowHalfY = window.innerHeight / 2;

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize(window.innerWidth, window.innerHeight);

}

function onDocumentMouseMove(event) {

    mouseX = (event.clientX - windowHalfX);
    mouseY = (event.clientY - windowHalfY);

}

//

function animate() {

    requestAnimationFrame(animate);

    render();
    stats.update();

}

function render() {

    camera.position.x += (mouseX - camera.position.x) * 0.05;
    camera.position.y += (-mouseY - camera.position.y) * 0.05;

    camera.lookAt(scene.position);

    renderer.render(scene, camera);

}