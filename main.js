<<<<<<< HEAD
function horizontalMove() {
  const rightlines = document.getElementById("right");  
  const leftlines = document.getElementById("left");  
  
}

// window.addEventListener('scroll', () => {
//   const scrollPos = window.scrollY;
//   const divPos = divElement.getBoundingClientRect().top;
//   const diff = divPos - scrollPos;

//   // Linear interpolation
//   const progress = Math.min(1, Math.max(0, scrollPos / window.innerHeight));

//   // Move the div by 50% of the difference
//   divElement.style.transform = `translateY(${diff / 2 * progress}px)`;
//});
=======
const divElement = document.querySelector('.horizontal');

window.addEventListener('scroll', () => {
  const scrollPos = window.scrollY;
  const divPos = divElement.getBoundingClientRect().top;
  const diff = divPos - scrollPos;

  // Linear interpolation
  const progress = Math.min(1, Math.max(0, scrollPos / window.innerHeight));

  // Move the div by 50% of the difference
  divElement.style.transform = `translateY(${diff / 2 * progress}px)`;
});
>>>>>>> 27309919d3082816488610e53bfb77ea44a99d4e
