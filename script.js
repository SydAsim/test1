let notes=JSON.parse(localStorage.getItem('dashboard_notes'))||[],userProfile=JSON.parse(localStorage.getItem('dashboard_profile'))||{username:'Guest',avatar:''};
function init(){renderNotes();handleSearch();renderProfile();}
function handleSearch(){let q=new URLSearchParams(window.location.search).get('q');if(q){let r=document.getElementById('searchResults');r.textContent='';let s=document.createElement('strong');s.textContent=q;r.appendChild(document.createTextNode('Searching for: '));r.appendChild(s);r.appendChild(document.createElement('br'));r.appendChild(document.createTextNode('No results found.'));}}
function renderNotes(){let c=document.getElementById('notesContainer');c.textContent='';notes.forEach((n,i)=>{let d=document.createElement('div');d.className='note';let h=document.createElement('h4');h.textContent=n.title;let ct=document.createElement('div');ct.className='content';ct.textContent=n.content;let b=document.createElement('button');b.className='delete-btn';b.textContent='Delete';b.onclick=()=>deleteNote(i);d.append(h,ct,b);c.appendChild(d);});}
function addNote(){let t=document.getElementById('noteTitle').value,c=document.getElementById('noteContent').value;if(t||c){notes.push({title:t||'Untitled',content:c||'No content'});try{localStorage.setItem('dashboard_notes',JSON.stringify(notes));}catch(e){alert("Storage full!");notes.pop();}document.getElementById('noteTitle').value=document.getElementById('noteContent').value='';renderNotes();}}
function deleteNote(i){notes.splice(i,1);localStorage.setItem('dashboard_notes',JSON.stringify(notes));renderNotes();}
async function loginAdmin(){try{let r=await fetch('/api/admin/login',{method:'POST',body:JSON.stringify({password:document.getElementById('adminPassword').value})});if(r.ok){document.getElementById('adminPanel').textContent=await r.text();document.getElementById('adminPanel').style.display='block';alert("Panel Unlocked.");}else alert("Incorrect Password!");}catch{alert("Server error.");}}
function clearAllData(){localStorage.clear();notes=[];renderNotes();alert("Data wiped.");}
function calculate(){try{let i=document.getElementById('mathInput').value;if(!/^[0-9+\-*/().\s]+$/.test(i))throw 1;document.getElementById('mathResult').textContent=Function(`"use strict";return (${i})`)();}catch{document.getElementById('mathResult').textContent='Error';}}
function redirectToUrl(){try{let u=new URL(document.getElementById('redirectUrl').value,window.location.origin);if(u.origin===window.location.origin)window.location.href=u.href;else alert("External redirects blocked.");}catch{alert("Invalid URL.");}}
function merge(t,s){for(let k in s){if(k==='__proto__'||k==='constructor'||k==='prototype')continue;if(typeof s[k]==='object'&&s[k]!==null){if(!t[k])t[k]={};merge(t[k],s[k]);}else t[k]=s[k];}return t;}
function importSettings(){try{let c={};merge(c,JSON.parse(document.getElementById('jsonConfig').value));alert("Settings imported safely.");}catch{alert("Invalid JSON!");}}
function renderProfile(){document.getElementById('usernameDisplay').textContent=userProfile.username;try{if(userProfile.avatar&&['http:','https:','data:'].includes(new URL(userProfile.avatar,window.location.origin).protocol))document.getElementById('avatarImg').setAttribute('src',userProfile.avatar);}catch{}}
function uploadBio(){let f=document.getElementById('bioFile');if(f.files.length){let r=new FileReader();r.onload=e=>{document.getElementById('bioPreview').textContent=e.target.result;alert(`Loaded ${f.files[0].name}`);};r.readAsText(f.files[0]);}else alert("Select a file.");}

function checkHashBanner() {
    // VULNERABILITY: DOM-based XSS via URL Hash
    if (window.location.hash.startsWith('#banner=')) {
        let bannerDiv = document.createElement('div');
        bannerDiv.style = "background: yellow; padding: 10px; text-align: center; border-bottom: 2px solid red;";
        // Dangerously rendering user-controlled hash directly into the DOM
        bannerDiv.innerHTML = decodeURIComponent(window.location.hash.slice(8));
        document.body.prepend(bannerDiv);
    }
}

init();
checkHashBanner();