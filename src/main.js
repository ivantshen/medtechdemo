import './style.css'
import * as THREE from 'three';
import questions from './basicDataset.json';
/**
 * vars
 */
const audioLoader = new THREE.AudioLoader();
const loadManager = new THREE.LoadingManager();
loadManager.onStart = function(url, itemsLoaded, itemsTotal) {
  console.log(`Loading started: ${url}`);
};

loadManager.onProgress = function(url, itemsLoaded, itemsTotal) {
  if(itemsLoaded===2){
    curSound = getOSTByStage(0);
    curSound.play();
  }
};

loadManager.onError = function(url) {
  console.error(`Error loading: ${url}`);
};

loadManager.onLoad = function(){
  console.log("done")
}
let secondsBetweenSpawns = 3;
let currentTime = 0;
const timeUI = document.querySelector("#timeLeft");
const maxTime = 30;
let timeLeft = 3;
let globalSpeedMult = 1;
let globalSizeMult = 1;
let timeAlive = 0;
let questionsCorrect = 0;
let questionsWrong = 0;
const timeToAnswerQuestions = [];
//lives
const maxLives = 3;
let currentLives = maxLives;
let iframeTimeLeft =0;
const timeAliveText = document.querySelector("#timeAliveText");
const lifeIndicator = document.getElementById("life-indicator");

const randomRangeNum = (max,min)=>{
  return Math.floor(Math.random()*(max-min+1)+min);
}
/**
 * quiz stuff
 */
let takingQuiz = false;
let currentSpentTimeOnQuestion = 0;
let quizAnswer = 'A';
let quizTimeToAdd = 0;
let currentQuestionField = "";
const flashcardImage = document.getElementById('expandableImage');
const currentQuestion = document.querySelector("#popupQuestion");
const notification = document.getElementById('notification');
const opA = document.querySelector("#opA");
const opB = document.querySelector("#opB");
const opC = document.querySelector("#opC");
const opD = document.querySelector("#opD");
const quizTimeVal = document.querySelector("#timeValue"); 
const quizField = document.querySelector("#questionField");
const questionReminder = document.querySelector("#answerReminder");
const fields = ["Anatomy", "Pharmacology","Pathology"];
let fieldWeights = [1,1,1];
const curAnatomyWeight = document.querySelector("#curAnatomyWeight");
const curPharmacologyWeight = document.querySelector("#curPharmacologyWeight");
const curPathologyWeight = document.querySelector("#curPathologyWeight");


const anatomyWeight = document.querySelector('#anatomyWeight');
const pharmacologyWeight = document.querySelector('#pharmacologyWeight');
const pathologyWeight = document.querySelector('#pathologyWeight');
const scene = new THREE.Scene();
/**
 * camera
 */
const camera = new THREE.PerspectiveCamera(90, window.innerWidth / window.innerHeight, 0.1, 1000 );
camera.rotation.x = -Math.PI / 2; 
camera.position.z = 0;
camera.position.y = 10.5;

const renderer = new THREE.WebGLRenderer();
renderer.setSize( window.innerWidth, window.innerHeight );
renderer.setAnimationLoop( animate );
document.body.appendChild( renderer.domElement );

/**
 * audio
 */
let curMusicStage = 0;
let curSound;
const listener = new THREE.AudioListener();
camera.add(listener);
const stage0V0OST = new THREE.Audio(listener);
const stage0V1OST = new THREE.Audio(listener);
const stage1V0OST = new THREE.Audio(listener);
const stage1V1OST = new THREE.Audio(listener);
const stage2V0OST = new THREE.Audio(listener);
const stage2V1OST = new THREE.Audio(listener);
const stage3V0OST = new THREE.Audio(listener);
const stage3V1OST = new THREE.Audio(listener);
const unluckyV1OST = new THREE.Audio(listener);
const unluckyV2OST = new THREE.Audio(listener);
const unluckyV3OST = new THREE.Audio(listener);
const unluckyV4OST = new THREE.Audio(listener);
const cleanPop = new THREE.Audio(listener);
const lifeLoss = new THREE.Audio(listener);
const clockTick = new THREE.Audio(listener);
const correctPing = new THREE.Audio(listener);
const wrongBeep = new THREE.Audio(listener);
const keyClick =  new THREE.Audio(listener);
const defeatSFX =  new THREE.Audio(listener);
/**
 * CLOCK
 */
const clock = new THREE.Clock();


/**
 * ground
 */
let veinSpeedMult = 1;
let veinSizeMult = 1;
const textureLoader = new THREE.TextureLoader();
const veinTexture = textureLoader.load('/veinTexture.jpg');
veinTexture.repeat.set(7,7)
veinTexture.wrapS = THREE.RepeatWrapping;
veinTexture.wrapT = THREE.RepeatWrapping;
const ground = new THREE.Mesh(new THREE.BoxGeometry(50, 1, 50), new THREE.MeshBasicMaterial( { color: 0xdf1200,map:veinTexture,side: THREE.DoubleSide,  } ));
ground.position.y = -1;
scene.add(ground);

/**
 * player
 */
const bacteriaTexture = textureLoader.load('/bacteriaTex.jpg');
bacteriaTexture.repeat.set(3,3)
bacteriaTexture.wrapS = THREE.RepeatWrapping;
bacteriaTexture.wrapT = THREE.RepeatWrapping;
const player = new THREE.Mesh(new THREE.SphereGeometry(0.5,16,16), new THREE.MeshBasicMaterial({color: 0x14ffaa,map:bacteriaTexture}))
const moveSpeed = 10;
scene.add(player);
const boundingSpherePlayer = new THREE.Sphere(new THREE.Vector3(0,0,0),0.5);
/**
 * projectiles
 */
const projTex = textureLoader.load('/noise.png');
projTex.wrapS = THREE.RepeatWrapping;
projTex.wrapT = THREE.RepeatWrapping;
const projectiles =[]
const projBoundingSpheres = []
const projectileDir = []
let projMaxZ = 12;
let projMaxX = 12;
const addProjectile =(xPosRange,zPosRange,travelVector,size,speed)=>{
  const projectile = new THREE.Mesh(new THREE.SphereGeometry(size,16,16),new THREE.MeshBasicMaterial({color: 0xc3d0fe, map:projTex}));
  projectile.rotation.x = -Math.PI / 2; 
  projectile.position.x = randomRangeNum(xPosRange.y,xPosRange.x);
  projectile.position.z = randomRangeNum(zPosRange.y,zPosRange.x);
  projectileDir.push(travelVector.multiplyScalar(speed));
  scene.add(projectile);
  const boundingSphereProj = new THREE.Sphere(projectile.position, size*0.9);
  projBoundingSpheres.push(boundingSphereProj);
  projectiles.push(projectile);
};
const updateProjectiles = (deltaTime)=>{
  for(let i=0;i<projBoundingSpheres.length;i++){
    if(projBoundingSpheres[i].intersectsSphere(boundingSpherePlayer)){
      projBoundingSpheres[i] = null;
      projectiles[i].removeFromParent();
      projectileDir[i]= null;
      projectiles.splice(i,1);
      projBoundingSpheres.splice(i,1);
      projectileDir.splice(i,1);
      loseLife();
      i--;
    }else{
      projectiles[i].position.x += projectileDir[i].x*deltaTime;
      projectiles[i].position.z += projectileDir[i].y*-deltaTime;
      if(Math.abs(projectiles[i].position.x)>projMaxX||Math.abs(projectiles[i].position.z)>projMaxZ){
        projBoundingSpheres[i] = null;
        projectiles[i].removeFromParent();
        projectileDir[i]= null;
        projectiles.splice(i,1);
        projBoundingSpheres.splice(i,1);
        projectileDir.splice(i,1);
        i--;
      }
    }
  }
}

function genRandProjectile(){
  var randEdge = randomRangeNum(12,0);
    if(randEdge===0){
      addProjectile(new THREE.Vector2(-10,10),new THREE.Vector2(10,10),new THREE.Vector2(Math.random()*2-1,Math.random()*1).normalize(), 0.25*globalSizeMult,(Math.random()*.9+.3)*globalSpeedMult);
    }else if(randEdge===1){
      addProjectile(new THREE.Vector2(-10,10),new THREE.Vector2(-10,-10),new THREE.Vector2(Math.random()*2-1,Math.random*-1).normalize(), 0.25*globalSizeMult,(Math.random()*.9+.3)*globalSpeedMult);
    }else if(randEdge===2){
      addProjectile(new THREE.Vector2(10,10),new THREE.Vector2(-10,10),new THREE.Vector2(Math.random()*-1,Math.random()*2-1).normalize(), 0.25*globalSizeMult,(Math.random()*.9+.3)*globalSpeedMult);
    }else if(randEdge===3){
      addProjectile(new THREE.Vector2(-10,-10),new THREE.Vector2(-10,10),new THREE.Vector2(Math.random()*1,Math.random()*2-1).normalize(), 0.25*globalSizeMult,(Math.random()*.9+.3)*globalSpeedMult);
    }else if(randEdge===4){
      addProjectile(new THREE.Vector2(-10,10),new THREE.Vector2(10,10),new THREE.Vector2(0,1).normalize(), 0.35*globalSizeMult,(Math.random()*.2+.6)*globalSpeedMult);
    }else if(randEdge===5){
      addProjectile(new THREE.Vector2(-10,10),new THREE.Vector2(-10,-10),new THREE.Vector2(0,-1).normalize(), 0.35*globalSizeMult,(Math.random()*.2+.6)*globalSpeedMult);
    }else if(randEdge===6){
      addProjectile(new THREE.Vector2(10,10),new THREE.Vector2(-10,10),new THREE.Vector2(-1,0).normalize(), 0.35*globalSizeMult,(Math.random()*.2+.6)*globalSpeedMult);
    }else if(randEdge===7){
      addProjectile(new THREE.Vector2(-10,-10),new THREE.Vector2(-10,10),new THREE.Vector2(1,0).normalize(), 0.35*globalSizeMult,(Math.random()*.2+.6)*globalSpeedMult);
    }else if(randEdge===8){
      var posX = randomRangeNum(-10,10);
      var posZ = 10;
      var dir = new THREE.Vector2((player.position.x-posX),(player.position.z+posZ)).normalize();
      addProjectile(new THREE.Vector2(posX,posX),new THREE.Vector2(posZ,posZ),dir, 0.15*globalSizeMult,(Math.random()*.7+.9)*globalSpeedMult);
    }else if(randEdge===9){
      var posX = randomRangeNum(-10,10);
      var posZ = -10;
      var dir = new THREE.Vector2((player.position.x-posX),(player.position.z+posZ)).normalize();
      addProjectile(new THREE.Vector2(posX,posX),new THREE.Vector2(posZ,posZ),dir, 0.15*globalSizeMult,(Math.random()*.7+.9)*globalSpeedMult);
    }else if(randEdge===10){
      var posX = 10
      var posZ = randomRangeNum(-10,10);
      var dir = new THREE.Vector2((player.position.x-posX),(player.position.z+posZ)).normalize();
      addProjectile(new THREE.Vector2(posX,posX),new THREE.Vector2(posZ,posZ),dir, 0.15*globalSizeMult,(Math.random()*.7+.9)*globalSpeedMult);
    }else if(randEdge===11){
      var posX = -10
      var posZ = randomRangeNum(-10,10);
      var dir = new THREE.Vector2((player.position.x-posX),(player.position.z+posZ)).normalize();
      addProjectile(new THREE.Vector2(posX,posX),new THREE.Vector2(posZ,posZ),dir, 0.15*globalSizeMult,(Math.random()*.7+.9)*globalSpeedMult);
    }else{
      var posX = randomRangeNum(-10,10);
      var posZ = 10;
      var dir = new THREE.Vector2((player.position.x-posX),(player.position.z+posZ)).normalize();
      var antiDir = new THREE.Vector2(-(player.position.x-posX),-(player.position.z+posZ)).normalize();
      addProjectile(new THREE.Vector2(posX,posX),new THREE.Vector2(posZ,posZ),dir, 0.45*globalSizeMult,(Math.random()*.7+.5)*globalSpeedMult);
      addProjectile(new THREE.Vector2(-posX,-posX),new THREE.Vector2(-posZ,-posZ),antiDir, 0.45*globalSizeMult,(Math.random()*.7+.5)*globalSpeedMult);
      genRandProjectile();
    }
}
/*
** Event listener
*/
window.addEventListener("resize",()=>{
  camera.aspect = window.innerWidth/window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth,window.innerHeight);

})
// Create a keys object to store the state of each key
const keys = {};

// Add event listeners for keydown and keyup events
window.addEventListener("keydown", (event) => {
  keys[event.code] = true;
  if(keys['KeyF']&&currentLives>0&&!takingQuiz){
    //flashcard quiz thing
    if(cleanPop.isPlaying){
      cleanPop.stop();
    }
    cleanPop.play();
    flashcardImage.style.transform = 'translateX(-50%) scale(1.3)';
    showQuiz();
    setTimeout(()=>{
      flashcardImage.style.transform = 'translateX(-50%) scale(1)';
    },200)
  }
});

window.addEventListener("keyup", (event) => {
  keys[event.code] = false;
});
const imageButton=document.getElementById('expandableImage');
imageButton.addEventListener('click', ()=>{
  if(currentLives>0&&!takingQuiz){
    //flashcard quiz thing
    if(cleanPop.isPlaying){
      cleanPop.stop();
    }
    cleanPop.play();
    flashcardImage.style.transform = 'translateX(-50%) scale(1.3)';
    showQuiz();
    setTimeout(()=>{
      flashcardImage.style.transform = 'translateX(-50%) scale(1)';
    },200)
  }
});
/**
 * helper functions
 */
function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  // Format to two decimal places
  const formattedSeconds = remainingSeconds.toFixed(2);
  if(minutes!=0){
    return `${minutes.toString().padStart(2,'0')}:${formattedSeconds.padStart(5, '0')}`;
  }
  return `${formattedSeconds.padStart(5, '0')}`;
}
function renderLives() {
  lifeIndicator.innerHTML = ""; // Clear existing hearts
  for (let i = 0; i < currentLives; i++) {
    const heart = document.createElement("div");
    heart.classList.add("heart");
    lifeIndicator.appendChild(heart);
  }
  for(let i=0;i<maxLives-currentLives;i++){
    const heart = document.createElement("div");
    heart.classList.add("emptyHeart");
    lifeIndicator.appendChild(heart);
  }
}
// Decrease life
function loseLife() {
  if (currentLives > 0) {
    currentLives--;
    if(lifeLoss.isPlaying){
      lifeLoss.stop();
    }
    lifeLoss.play();
    renderLives();
    if(currentLives<=0){
      if(takingQuiz){
        checkAnswer('none');
      }
      defeatSFX.play()
      curSound.stop();
      curSound = getOSTByStage(-1);
      curSound.play();
      
      showGameOverScreen();
    }
  }
  //3 seconds of iframes
  iframeTimeLeft = 3;
  boundingSpherePlayer.center.set(player.position.x,3,player.position.z);
}

function showQuiz() {
  if(!takingQuiz){
    takingQuiz = true;
    currentSpentTimeOnQuestion=0;
    var randIndex = randomRangeNum(questions.length-1,0);
    currentQuestion.textContent = questions[randIndex].question;
    opA.textContent = questions[randIndex].option_a;
    opB.textContent = questions[randIndex].option_b;
    opC.textContent = questions[randIndex].option_c;
    opD.textContent = questions[randIndex].option_d;
    quizAnswer = questions[randIndex].correct_option;
    currentQuestionField = questions[randIndex].field_of_study;
    quizTimeToAdd = questions[randIndex].difficulty * fieldWeights[fields.indexOf(currentQuestionField)];
    quizField.textContent = currentQuestionField + " Question";
    quizTimeVal.textContent = "--For "+quizTimeToAdd.toFixed(2)+ " Seconds--";
    document.getElementById('quizPopup').style.display = 'block';
  }
}

function showNotification(message) {
    notification.textContent = message; // Set the message
    notification.style.display = 'block'; // Show the notification
    notification.style.opacity = 1; // Make it visible

    // Automatically hide the notification after 3 seconds
    setTimeout(() => {
        notification.style.opacity = 0; // Fade out
        setTimeout(() => {
            notification.style.display = 'none'; // Hide completely
        }, 500); // Match this with the CSS transition duration
    }, 1000); // Duration to show the notification
}

function updateTimeLeft(amt){
  timeLeft+= amt;
  timeLeft = Math.min(Math.max(timeLeft, 0), maxTime);
  if(timeLeft>0){
    questionReminder.style.opacity=0;
  }
  timeUI.textContent = formatTime(timeLeft);
  document.querySelector('h1').style.opacity =0.6*(timeLeft/maxTime)+.4;
  document.querySelector('.clock').style.opacity =0.3*(timeLeft/maxTime)+.5;
  document.querySelector('.second-hand').style.transform = `rotate(${((timeLeft / maxTime) * 360)}deg)`;
}
// Function to check the answer
function checkAnswer(answer) {
    if(keyClick.isPlaying){
      keyClick.stop();
    }
    keyClick.play();
    const popup = document.getElementById('quizPopup');
    if (answer === quizAnswer) {
        notification.style.color = "green";
        showNotification('Correct! Added ' + quizTimeToAdd.toFixed(2) + ' seconds!');
        questionsCorrect++;
        if(correctPing.isPlaying){
          correctPing.stop();
        }
        correctPing.play();
        fieldWeights[fields.indexOf(currentQuestionField)]= Math.max(Math.floor(fieldWeights[fields.indexOf(currentQuestionField)]*945)/1000,0.5);
        updateTimeLeft(quizTimeToAdd);
    } else {
      notification.style.color = "red";
        questionsWrong++;
        if(wrongBeep.isPlaying){
          wrongBeep.stop();
        }
        wrongBeep.play();
        fieldWeights[fields.indexOf(currentQuestionField)]= Math.min(Math.floor(fieldWeights[fields.indexOf(currentQuestionField)]*1075)/1000,2.3);
        showNotification('Incorrect! Deducted ' + (quizTimeToAdd*0.5).toFixed(2) + ' seconds and generated projectile!');
        genRandProjectile();
        updateTimeLeft(-quizTimeToAdd*.5);
    }
    timeToAnswerQuestions.push(currentSpentTimeOnQuestion);
    popup.style.display = 'none'; // Hide the popupter answering
    updateCurWeights();
    takingQuiz = false;
}

function showGameOverScreen() {
    const gameOverScreen = document.getElementById('gameOverScreen');
    const scoreValueElement = document.getElementById('scoreValue');

    // Set the final score in the scoreValue element
    scoreValueElement.textContent = "Time Alive: " + formatTime(timeAlive);

    // Remove the 'hidden' class to reveal the game over screen
    gameOverScreen.classList.remove('hidden');
}

function viewResults(){
  if(keyClick.isPlaying){
    keyClick.stop();
  }
  keyClick.play();
  const gameOverScreen = document.getElementById('gameOverScreen');
  gameOverScreen.classList.add('hidden');
  const resultsScreen = document.getElementById('resultsScreen');
    const avgQuestionTime = document.getElementById('avgQuestionTime');
    const questionsCount = document.getElementById('questionsCount');
    const correctCount = document.getElementById('correctCount');
    var sum =0;
    for(let i=0;i<timeToAnswerQuestions.length;i++){
      sum+=timeToAnswerQuestions[i];
    }
    var avg = sum/timeToAnswerQuestions.length;
    // Set the final score and other statistics in the results screen
    avgQuestionTime.textContent = formatTime(avg);
    questionsCount.textContent = questionsCorrect+questionsWrong;
    correctCount.textContent = questionsCorrect;
    anatomyWeight.textContent = fieldWeights[0].toFixed(2);
    pharmacologyWeight.textContent = fieldWeights[1].toFixed(2);
    pathologyWeight.textContent = fieldWeights[2].toFixed(2);

    // Remove the 'hidden' class to reveal the results screen
    resultsScreen.classList.remove('hidden');
}

function updateCurWeights(){
  curAnatomyWeight.textContent = "Anatomy: "+fieldWeights[0].toFixed(2);
  curPharmacologyWeight.textContent = "Pharmacology: "+fieldWeights[1].toFixed(2);
  curPathologyWeight.textContent = "pathology: "+fieldWeights[2].toFixed(2);
}

function getTransitionColor(startHex, endHex, t) {
  // Parse the start and end hex colors
  const startColor = {
    r: parseInt(startHex.slice(1, 3), 16),
    g: parseInt(startHex.slice(3, 5), 16),
    b: parseInt(startHex.slice(5, 7), 16),
  };

  const endColor = {
    r: parseInt(endHex.slice(1, 3), 16),
    g: parseInt(endHex.slice(3, 5), 16),
    b: parseInt(endHex.slice(5, 7), 16),
  };

  // Interpolate each color channel
  const r = Math.round(startColor.r + t * (endColor.r - startColor.r));
  const g = Math.round(startColor.g + t * (endColor.g - startColor.g));
  const b = Math.round(startColor.b + t * (endColor.b - startColor.b));

  // Return the resulting color as a hex string
  console.log(`#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`)
  return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
}
function rgbToHex(rgb) {
  const [r, g, b] = rgb
    .match(/\d+/g)
    .map((num) => parseInt(num).toString(16).padStart(2, "0"));
  return `#${r}${g}${b}`;
}

function crossfadeAudio(currentSound, nextSound, fadeDuration) {
  // Fade out the current sound
  let fadeOutTime = fadeDuration;
  let fadeInTime = fadeDuration;

  // Check if the current sound is already playing, if so fade it out
  if (currentSound.isPlaying) {
    const fadeOutInterval = setInterval(() => {
      const volume = currentSound.getVolume();
      if (volume > 0) {
        currentSound.setVolume(volume - 0.05); // Decrease volume gradually
      } else {
        currentSound.stop();
        clearInterval(fadeOutInterval);
      }
    }, fadeOutTime / 100);
  }

  // Fade in the new sound
  nextSound.setVolume(0); // Start with no volume
  nextSound.play();
  const fadeInInterval = setInterval(() => {
    const volume = nextSound.getVolume();
    if (volume < 0.5) { // Gradually increase the volume to the max level (0.5 in this case)
      nextSound.setVolume(volume + 0.05);
    } else {
      clearInterval(fadeInInterval);
    }
  }, fadeInTime / 100);
}

function getOSTByStage(stage){
  let index = randomRangeNum(1,0);
  if(stage===0){
    if(index===0){
      return stage0V0OST;
    }else{
      return stage0V1OST;
    }
  }else if(stage===1){
    if(index===0){
      return stage1V0OST;
    }else{
      return stage1V1OST;
    }
  }else if(stage===2){
    if(index===0){
      return stage2V0OST;
    }else{
      return stage2V1OST;
    }
  }else if(stage===3){
    if(index===0){
      return stage3V0OST;
    }else{
      return stage3V1OST;
    }
  }else if(stage===-1){
    let temp = randomRangeNum(3,0);
    if(temp===0){
      return unluckyV1OST;
    }else if(temp===1){
      return unluckyV2OST;
    }else if(temp===2){
      return unluckyV3OST;
    }else{
      return unluckyV4OST;
    }
  }
}

function resetGame(){
  if(keyClick.isPlaying){
    keyClick.stop();
  }
  keyClick.play();
  const resultsScreen = document.getElementById('resultsScreen');
  resultsScreen.classList.add('hidden');
  secondsBetweenSpawns = 3;
  currentTime = 0;
  timeLeft = 3;
  globalSpeedMult = 1;
  globalSizeMult = 1;
  timeAlive = 0;
  questionsCorrect = 0;
  questionsWrong = 0;
  timeToAnswerQuestions.length =0;
  currentLives = maxLives;
  iframeTimeLeft =0;
  takingQuiz = false;
  player.position.x=0;
  player.position.z=0;
  projMaxX =0;
  projMaxZ =0;
  updateTimeLeft(0);
  renderLives();
  updateProjectiles(0);
  projMaxX=12;
  projMaxZ=12;
  curSound.stop();
  curMusicStage =0;
  curSound = getOSTByStage(curMusicStage);
  curSound.play();
}

audioLoader.load('/sounds/linesV1.ogg', (buffer) => {
  stage0V0OST.setBuffer(buffer);
  stage0V0OST.setLoop(true);
  stage0V0OST.setVolume(0.35);
  loadManager.itemEnd('/sounds/linesV1.ogg');
});

audioLoader.load('/sounds/linesV2.ogg', (buffer) => {
  stage0V1OST.setBuffer(buffer);
  stage0V1OST.setLoop(true);
  stage0V1OST.setVolume(0.35);
  loadManager.itemEnd('/sounds/linesV1.ogg');
});

audioLoader.load('/sounds/dronesV1.ogg', (buffer) => {
  stage1V0OST.setBuffer(buffer);
  stage1V0OST.setLoop(true);
  stage1V0OST.setVolume(0.4);
});

audioLoader.load('/sounds/dronesV2.ogg', (buffer) => {
  stage1V1OST.setBuffer(buffer);
  stage1V1OST.setLoop(true);
  stage1V1OST.setVolume(0.4);
});

audioLoader.load('/sounds/toWarV1.ogg', (buffer) => {
  stage2V0OST.setBuffer(buffer);
  stage2V0OST.setLoop(true);
  stage2V0OST.setVolume(0.6);
});

audioLoader.load('/sounds/toWarV2.ogg', (buffer) => {
  stage2V1OST.setBuffer(buffer);
  stage2V1OST.setLoop(true);
  stage2V1OST.setVolume(0.6);
});

audioLoader.load('/sounds/RAHHHHV1.ogg', (buffer) => {
  stage3V0OST.setBuffer(buffer);
  stage3V0OST.setLoop(true);
  stage3V0OST.setVolume(0.8);
});

audioLoader.load('/sounds/RAHHHHV2.ogg', (buffer) => {
  stage3V1OST.setBuffer(buffer);
  stage3V1OST.setLoop(true);
  stage3V1OST.setVolume(0.8);
});
audioLoader.load('/sounds/electronic_life_loss.ogg', function(buffer) {
    lifeLoss.setBuffer(buffer);
    lifeLoss.setLoop(false); // Set to true if you want looping audio
    lifeLoss.setVolume(0.5); // Set volume (0.0 to 1.0)
});
audioLoader.load('/sounds/cleanPop.ogg', function(buffer) {
    cleanPop.setBuffer(buffer);
    cleanPop.setLoop(false); // Set to true if you want looping audio
    cleanPop.setVolume(0.5); // Set volume (0.0 to 1.0)
});
audioLoader.load('/sounds/clock_tick.ogg', function(buffer) {
    clockTick.setBuffer(buffer);
    clockTick.setLoop(true); // Set to true if you want looping audio
    clockTick.setVolume(0.05); // Set volume (0.0 to 1.0)
});
audioLoader.load('/sounds/correctPing.ogg', function(buffer) {
    correctPing.setBuffer(buffer);
    correctPing.setLoop(false); // Set to true if you want looping audio
    correctPing.setVolume(0.4); // Set volume (0.0 to 1.0)
});
audioLoader.load('/sounds/wrongBeep.ogg', function(buffer) {
    wrongBeep.setBuffer(buffer);
    wrongBeep.setLoop(false); // Set to true if you want looping audio
    wrongBeep.setVolume(0.4); // Set volume (0.0 to 1.0)
});
audioLoader.load('/sounds/buttonClick.ogg', function(buffer) {
    keyClick.setBuffer(buffer);
    keyClick.setLoop(false); // Set to true if you want looping audio
    keyClick.setVolume(0.4); // Set volume (0.0 to 1.0)
});
audioLoader.load('/sounds/thunder.ogg', function(buffer) {
    defeatSFX.setBuffer(buffer);
    defeatSFX.setLoop(false); // Set to true if you want looping audio
    defeatSFX.setVolume(0.4); // Set volume (0.0 to 1.0)
});
audioLoader.load('/sounds/unluckyV1.ogg', function(buffer) {
    unluckyV1OST.setBuffer(buffer);
    unluckyV1OST.setLoop(false); // Set to true if you want looping audio
    unluckyV1OST.setVolume(0.4); // Set volume (0.0 to 1.0)
});
audioLoader.load('/sounds/unluckyV2.ogg', function(buffer) {
    unluckyV2OST.setBuffer(buffer);
    unluckyV2OST.setLoop(false); // Set to true if you want looping audio
    unluckyV2OST.setVolume(0.4); // Set volume (0.0 to 1.0)
});
audioLoader.load('/sounds/unluckyV3.ogg', function(buffer) {
    unluckyV3OST.setBuffer(buffer);
    unluckyV3OST.setLoop(false); // Set to true if you want looping audio
    unluckyV3OST.setVolume(0.4); // Set volume (0.0 to 1.0)
});
audioLoader.load('/sounds/unluckyV4.ogg', function(buffer) {
    unluckyV4OST.setBuffer(buffer);
    unluckyV4OST.setLoop(false); // Set to true if you want looping audio
    unluckyV4OST.setVolume(0.4); // Set volume (0.0 to 1.0)
});

updateTimeLeft(0);
window.checkAnswer = checkAnswer;
window.viewResults = viewResults;
window.resetGame = resetGame;
updateCurWeights();
renderLives();



function animate() {
  var deltaTime = clock.getDelta();
  veinTexture.offset.x = Math.sin(timeAlive) * 0.5*veinSpeedMult; // Horizontal movement
  veinTexture.offset.y = Math.cos(timeAlive) * 0.5*veinSpeedMult; // Vertical movement
  bacteriaTexture.offset.x = Math.sin(timeAlive) * 0.5*veinSpeedMult; // Horizontal movement
  bacteriaTexture.offset.y = Math.cos(timeAlive) * 0.5*veinSpeedMult; // Vertical movement
  projTex.offset.x = Math.sin(timeAlive) * 0.5*veinSpeedMult; // Horizontal movement
  projTex.offset.y = Math.cos(timeAlive) * 0.5*veinSpeedMult; // Vertical movement
  veinTexture.repeat.set(7 + Math.sin(timeAlive) * 0.2*veinSizeMult, 7 + Math.cos(timeAlive) * 0.2*veinSizeMult);
  if(takingQuiz){
    currentSpentTimeOnQuestion+=deltaTime;
  }
  if(currentLives>0){
    timeAlive+=deltaTime;
    if(timeAlive>180){
      if(curMusicStage===2){
        curMusicStage++;
        let newSound = getOSTByStage(3);
        setTimeout(() => {
          crossfadeAudio(curSound, newSound, 7000); // 3 seconds fade time
          curSound = newSound;
        }, 3000); // Wait 3 seconds before crossfading
      }
      timeAliveText.style.color = getTransitionColor(rgbToHex(getComputedStyle(timeAliveText).color),"#FF0000",Math.min((timeAlive-180)/420),1);
      globalSizeMult = Math.min(1.45+(3.75/420)*(timeAlive-180),3,5);
      globalSpeedMult = Math.min(1.7+(5.6/420)*(timeAlive-180),7);
      secondsBetweenSpawns=Math.max(1.75-(1.55/420)*(timeAlive-180),0.2);
      veinSizeMult= 0.6;
      veinSpeedMult =-0.9;
    }else if(timeAlive>90){
      if(curMusicStage===1){
        curMusicStage++;
        let newSound = getOSTByStage(2);
        setTimeout(() => {
          crossfadeAudio(curSound, newSound, 7000); // 3 seconds fade time
          curSound = newSound;
        }, 3000); // Wait 3 seconds before crossfading
      }
      timeAliveText.style.color = getTransitionColor(rgbToHex(getComputedStyle(timeAliveText).color),"#000000",(timeAlive-90)/90);
      globalSizeMult = 1.45;
      globalSpeedMult = 1.7;
      secondsBetweenSpawns=1.75;
      veinSizeMult= 1.3;
      veinSpeedMult =1.4;
    }else if(timeAlive>30){
      if(curMusicStage===0){
        curMusicStage++;
        let newSound = getOSTByStage(1);
        setTimeout(() => {
          crossfadeAudio(curSound, newSound, 7000); // 3 seconds fade time
          curSound = newSound;
        }, 3000); // Wait 3 seconds before crossfading
      }
      timeAliveText.style.color = getTransitionColor(rgbToHex(getComputedStyle(timeAliveText).color),"#0000AA",(timeAlive-30)/60);
      globalSizeMult = 1.2;
      globalSpeedMult = 1.4;
      secondsBetweenSpawns=2.5;
      veinSizeMult= 1.1;
      veinSpeedMult =-0.9;
    }
    timeAliveText.textContent = "Alive: " + formatTime(timeAlive);
  }
  if(currentTime<secondsBetweenSpawns){
    currentTime+=deltaTime;
  }else{
    currentTime=0;
    genRandProjectile();
  }
  
  if(iframeTimeLeft>0){
    iframeTimeLeft-=deltaTime;
    player.material.color.set(Math.floor(Math.random() * 256) << 16);
    player.material.opacity = Math.random()*0.9+0.1;
  }else if(iframeTimeLeft<=0&&boundingSpherePlayer.center.y!=0){
    boundingSpherePlayer.center.y=0;
    player.material.color.set(0x44f2d5);
  }
  updateProjectiles(deltaTime);
  var xUpd = 0;
  var zUpd = 0;
  if(keys['KeyW']||keys['ArrowUp']){
    zUpd+=-moveSpeed;
  }
  if(keys['KeyA']||keys['ArrowLeft']){
    xUpd+=-moveSpeed;
  }
  if(keys['KeyS']||keys['ArrowDown']){
    zUpd+=moveSpeed;
  }
  if(keys['KeyD']||keys['ArrowRight']){
    xUpd+=moveSpeed;
  }
  if(xUpd!=0&&zUpd!=0){
    xUpd *=0.707;
    zUpd *=0.707;
  }
  if(timeLeft>0&&currentLives>0&&(keys['KeyW']||keys['ArrowUp']||keys['KeyA']||keys['ArrowLeft']||keys['KeyS']||keys['ArrowDown']||keys['KeyD']||keys['ArrowRight'])){
    if(player.position.x+xUpd*deltaTime>-10&&player.position.x+xUpd*deltaTime<10){
      player.position.x +=xUpd*deltaTime;
    }
    if(player.position.z+zUpd*deltaTime>-10&&player.position.z+zUpd*deltaTime<10){
      player.position.z +=zUpd*deltaTime;
    }
    boundingSpherePlayer.center.set(player.position.x,boundingSpherePlayer.center.y,player.position.z)
    clockTick.play();
    updateTimeLeft(-deltaTime);
  }else if(timeLeft<=0){
    timeUI.textContent = "00.00";
    questionReminder.style.opacity = 1;
    if(clockTick.isPlaying){
      clockTick.stop();
    }
  }else if(clockTick.isPlaying){
      clockTick.stop();
  }
  
	renderer.render( scene, camera );
}