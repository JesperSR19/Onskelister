// ENKEL VISUELL SPERRE – IKKE SIKKER AUTENTISERING.
// Bytt ut teksten nedenfor med et eget passord før du publiserer.
// Passordet er synlig for alle som åpner den offentlige kildekoden.
const WISHLIST_PASSWORD = 'ønskeliste2026';
const SESSION_KEY = 'wishlist-unlocked-v1';
const gate = document.getElementById('passwordGate');
function unlock(){document.documentElement.classList.remove('password-locked');gate.hidden=true;}
if(sessionStorage.getItem(SESSION_KEY)==='yes')unlock();
document.getElementById('passwordForm').addEventListener('submit',event=>{
  event.preventDefault();
  const input=document.getElementById('wishlistPassword');
  if(input.value===WISHLIST_PASSWORD){sessionStorage.setItem(SESSION_KEY,'yes');unlock();}
  else {document.getElementById('passwordError').textContent='Feil passord. Prøv igjen ♡';input.select();}
});
document.getElementById('togglePassword').addEventListener('click',()=>{
  const input=document.getElementById('wishlistPassword');
  input.type=input.type==='password'?'text':'password';
  document.getElementById('togglePassword').textContent=input.type==='password'?'Vis':'Skjul';
});
