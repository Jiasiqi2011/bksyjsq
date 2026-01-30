document.addEventListener('DOMContentLoaded',function(){
const loader=document.querySelector('.loader');
const themeToggle=document.querySelector('.theme-toggle');
const themeNotification=document.querySelector('.theme-notification');
const broadcastText=document.querySelector('.broadcast-text');
const nav=document.getElementById('mainNav');
const imageSlider=document.getElementById('imageSlider');
const slides=[{img:'pic/1.jpg',title:'探索',desc:'学习，创新'},{img:'pic/2.jpg',title:'开源分享',desc:'共享知识，共同进步'},{img:'pic/3.jpg',title:'项目实践',desc:'学以致用，创造价值'}];
let currentSlide=0,broadcastAnimationStarted=false,themeIndex=0;
const themes=['white','cream','dark'];
const themeNames=['白色主题','奶油主题','深色主题'];
setTimeout(()=>loader.classList.add('hidden'),2500);
setTimeout(()=>loader.style.display='none',3000);
if(themeToggle){
themeToggle.addEventListener('click',function(){
themeIndex=(themeIndex+1)%themes.length;
document.body.className=themes[themeIndex];
localStorage.setItem('theme',themes[themeIndex]);
themeNotification.textContent=`已切换到${themeNames[themeIndex]}`;
themeNotification.classList.add('show');
setTimeout(()=>themeNotification.classList.remove('show'),1500);
});}
const savedTheme=localStorage.getItem('theme')||'white';
document.body.className=savedTheme;
if(savedTheme==='cream')themeIndex=1;
if(savedTheme==='dark')themeIndex=2;
window.addEventListener('scroll',function(){
if(window.scrollY>100){
if(!nav.classList.contains('scrolled')){
nav.classList.add('scrolled');
setTimeout(()=>{
if(broadcastText&&!broadcastAnimationStarted){
broadcastText.classList.add('animate');
broadcastAnimationStarted=true;
}},1000);}
}else{
nav.classList.remove('scrolled');
if(broadcastText&&broadcastAnimationStarted){
broadcastText.classList.remove('animate');
broadcastAnimationStarted=false;
}}});
if(imageSlider){
slides.forEach(slide=>{
const slideDiv=document.createElement('div');
slideDiv.className='slide';
slideDiv.style.backgroundImage=`url('${slide.img}')`;
const slideContent=document.createElement('div');
const title=document.createElement('h3');
title.textContent=slide.title;
title.style.fontSize='2.5rem';
title.style.marginBottom='1rem';
title.style.background='linear-gradient(90deg,#0096c8,#00d4aa)';
title.style.webkitBackgroundClip='text';
title.style.webkitTextFillColor='transparent';
const desc=document.createElement('p');
desc.textContent=slide.desc;
desc.style.fontSize='1.5rem';
desc.style.opacity='0.9';
slideContent.appendChild(title);
slideContent.appendChild(desc);
slideDiv.appendChild(slideContent);
imageSlider.appendChild(slideDiv);});
function showSlide(index){currentSlide=(index+slides.length)%slides.length;imageSlider.style.transform=`translateX(-${currentSlide*100}%)`;}
if(slides.length>0){showSlide(0);setInterval(()=>showSlide(currentSlide+1),5000);}}
const videoContainer=document.querySelector('.hero-video-container.desktop');
if(videoContainer&&window.innerWidth>768){
const video=document.createElement('video');
video.autoplay=true;video.muted=true;video.loop=true;video.playsInline=true;
const source=document.createElement('source');
source.src='./pic/main.webm';source.type='video/webm';
video.appendChild(source);videoContainer.appendChild(video);}
const githubLink=document.getElementById('github-link');
if(githubLink){
githubLink.addEventListener('click',function(e){
e.preventDefault();
const url=prompt('GitHub主页：','https://github.com/jiasiqi2011');
if(url&&url.trim()!==''){this.href=url.trim();window.open(this.href,'_blank');}});}
document.querySelectorAll('.action-btn,.go-btn').forEach(btn=>{
btn.addEventListener('click',function(e){
const href=this.getAttribute('href');
if(href&&href!=='#'&&!this.classList.contains('nav-link')){window.location.href=href;}});});
});
