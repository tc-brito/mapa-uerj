'use strict';
const $=s=>document.querySelector(s), cats=[...new Set(ENTRIES.map(e=>e.category))],years=[...new Set(ENTRIES.map(e=>e.year))].sort((a,b)=>a-b);
const short=['Aritmética e raciocínio lógico','Funções e inequações','Geometria plana','Geometria espacial','Geometria analítica','Estatística descritiva','Probabilidade','Análise combinatória','Sequências, PA e PG','Porcentagem','Trigonometria','Polinômios','Matrizes e sistemas','Matemática financeira','Teoria dos conjuntos','Programação linear'];
let selected=cats[1], mode='map', zoom=1, openYears=new Set([2026]),openQuestions=new Set();
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const norm=s=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
function matches(e){const y=$('#year').value,q=norm($('#search').value.trim());return (!y||String(e.year)===y)&&(!q||norm([e.category,e.title,e.topics,e.year,'Questão '+String(e.number).padStart(2,'0'),'Questão '+e.number].join(' ')).includes(q));}
function filtered(){return ENTRIES.filter(matches)}
function actions(e){return `<div class="resource-actions"><a class="resource-link primary" href="${e.url}" target="_blank" rel="noopener" aria-label="Ver questão ${e.number} da prova ${e.year}, página ${e.page}">Ver questão <span aria-hidden="true">↗</span><small>Página ${e.page} da prova</small></a><a class="resource-link answer" href="${e.answerUrl}" target="_blank" rel="noopener" aria-label="Ver gabarito da questão ${e.number} de ${e.year}, página ${e.answerPage}">Ver gabarito <span aria-hidden="true">↗</span><small>Página ${e.answerPage} do gabarito</small></a></div>`}
function leaf(e){return `<section class="node detail" aria-label="Detalhamento da questão ${e.number} de ${e.year}"><span class="role">${e.role.includes('secundário')?'Conteúdo secundário · múltiplos conteúdos':'Conteúdo principal'}</span><p>${esc(e.topics)}</p>${actions(e)}<small class="pdf-note">PDFs abrem em outra aba.</small></section>`}
function render(){
 const data=filtered();const visibleCats=cats.filter(c=>data.some(e=>e.category===c));
 if(!visibleCats.includes(selected)&&visibleCats.length)selected=visibleCats[0];
 $('#categories').innerHTML=cats.map((c,i)=>{const n=data.filter(e=>e.category===c).length;return `<button class="cat ${selected===c?'active':''}" data-cat="${i}" aria-pressed="${selected===c}" style="--accent:${['#146c65','#426684','#926621','#796190'][i%4]}" ${n?'':'hidden'}><span class="dot"></span><span>${short[i]}</span><span class="count">${n}</span></button>`}).join('');
 $('#category-select').innerHTML=visibleCats.map(c=>`<option value="${cats.indexOf(c)}" ${c===selected?'selected':''}>${esc(short[cats.indexOf(c)])}</option>`).join('');
 $('#category-select').disabled=!visibleCats.length;
 const list=data.filter(e=>e.category===selected);$('#selected-title').textContent=selected;$('#result-count').textContent=`${list.length} ${list.length===1?'questão neste conteúdo':'questões neste conteúdo'} · ${new Set(data.map(e=>e.year+'-'+e.number)).size} ${new Set(data.map(e=>e.year+'-'+e.number)).size===1?'questão encontrada':'questões encontradas'} no total`;
 $('#map-view').hidden=mode!=='map';$('#list-view').hidden=mode!=='list';$('#reset').hidden=mode!=='map';
 $('#map-tab').classList.toggle('active',mode==='map');$('#list-tab').classList.toggle('active',mode==='list');$('#map-tab').setAttribute('aria-pressed',mode==='map');$('#list-tab').setAttribute('aria-pressed',mode==='list');
 if(!list.length){$('#graph').innerHTML='<div class="empty">Nenhuma questão encontrada.<br>Tente outro termo ou outra edição.</div>';$('#list-view').innerHTML=$('#graph').innerHTML;return;}
 const ys=[...new Set(list.map(e=>e.year))].sort((a,b)=>b-a);const searching=!!$('#search').value.trim();
 $('#graph').innerHTML=`<ul class="tree"><li><div class="node root">${esc(short[cats.indexOf(selected)])}</div><ul>${ys.map(y=>{const entries=list.filter(e=>e.year===y).sort((a,b)=>a.number-b.number), expanded=openYears.has(y);return `<li><button class="node year" data-year="${y}" aria-expanded="${expanded}">${y}<small>${entries.length} ${entries.length===1?'questão':'questões'} ${expanded?'−':'+'}</small></button>${expanded?`<ul>${entries.map(e=>{const key=e.year+'-'+e.number,expandedQ=openQuestions.has(key);return `<li><button class="node question ${e.role.includes('secundário')?'secondary':''}" data-q="${key}" aria-expanded="${expandedQ}"><b>QUESTÃO ${String(e.number).padStart(2,'0')} ${expandedQ?'−':'+'}</b>${esc(e.title)}</button>${expandedQ?`<ul><li>${leaf(e)}</li></ul>`:''}</li>`}).join('')}</ul>`:''}</li>`}).join('')}</ul></li></ul>`;
 $('#list-view').innerHTML=[...list].sort((a,b)=>b.year-a.year||a.number-b.number).map(e=>`<article class="result"><div class="meta">${e.year} · QUESTÃO ${String(e.number).padStart(2,'0')} · ${e.role.includes('secundário')?'CONTEÚDO SECUNDÁRIO':'CONTEÚDO PRINCIPAL'}</div><h3>${esc(e.title)}</h3><p>${esc(e.topics)}</p>${actions(e)}</article>`).join('');applyZoom();
}
const mobile=window.matchMedia('(max-width: 760px)');
function applyZoom(){ $('#graph').style.zoom=mobile.matches?1:zoom;$('#zoom-label').textContent=Math.round(zoom*100)+'%'; }
function selectCategory(index){selected=cats[Number(index)];openYears.clear();openQuestions.clear();zoom=1;render();$('#viewport').scrollTo(0,0)}
$('#categories').addEventListener('click',ev=>{const b=ev.target.closest('[data-cat]');if(b)selectCategory(b.dataset.cat)});
$('#category-select').addEventListener('change',ev=>selectCategory(ev.target.value));
mobile.addEventListener('change',applyZoom);
$('#graph').addEventListener('click',ev=>{const y=ev.target.closest('[data-year]'),q=ev.target.closest('[data-q]');if(y){const key=Number(y.dataset.year);openYears.has(key)?openYears.delete(key):openYears.add(key)}if(q){const key=q.dataset.q;openQuestions.has(key)?openQuestions.delete(key):openQuestions.add(key)}if(y||q){render(); const selector=y?`[data-year="${y.dataset.year}"]`:`[data-q="${q.dataset.q}"]`;const replacement=$('#graph').querySelector(selector);replacement?.focus({preventScroll:true})}});
$('#map-tab').onclick=()=>{mode='map';render()};$('#list-tab').onclick=()=>{mode='list';render()};
function filterChanged(){openQuestions.clear();openYears=new Set(filtered().map(e=>e.year));render()}
$('#search').addEventListener('input',filterChanged);$('#year').addEventListener('change',filterChanged);
$('#reset').onclick=()=>{openYears.clear();openQuestions.clear();$('#year').value='';$('#search').value='';zoom=1;render();$('#viewport').scrollTo(0,0)};
$('#plus').onclick=()=>{zoom=Math.min(1.3,zoom+.1);applyZoom()};$('#minus').onclick=()=>{zoom=Math.max(.4,zoom-.1);applyZoom()};$('#fit').onclick=()=>{const g=$('#graph'),v=$('#viewport');zoom=1;applyZoom();zoom=Math.max(.4,Math.min(1,(v.clientWidth-20)/g.scrollWidth,(v.clientHeight-20)/g.scrollHeight));applyZoom();v.scrollTo(0,0)};
$('#year').innerHTML+=[...years].reverse().map(y=>`<option value="${y}">${y}</option>`).join('');
$('#exams').innerHTML=[...years].reverse().map(y=>`<article class="exam"><div class="exam-title"><b>${y}</b><small>Exame discursivo</small></div><div class="exam-links"><a href="provas/uerj-${y}.pdf" target="_blank" rel="noopener" aria-label="Abrir prova completa de ${y}">Prova <span aria-hidden="true">↗</span></a><a href="gabaritos/uerj-${y}-gabarito.pdf" target="_blank" rel="noopener" aria-label="Abrir gabarito completo de ${y}">Gabarito <span aria-hidden="true">↗</span></a></div></article>`).join('');render();
