/* Visor ZRC Cuenca del Río Pato y Valle de Balsillas v0.2
 * Capas GeoJSON precargadas desde ./data/capas.js para funcionar por file://
 * Sin dependencias en servicios ArcGIS Online. Leaflet y teselas requieren internet.
 */
'use strict';
(function(){
const $=id=>document.getElementById(id);
const DATA=window.PATO_DATOS;
const clean=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const normalize=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('es-CO').trim();
const C={
 pretension:{name:'Pretensión de la Zona de Reserva Campesina Cuenca del Río Pato y Valle de Balsillas',group:'main',color:'#17a6b1',line:'#146f86',kind:'poly',visible:true,weight:2.6,opacity:.12},
 zrc_constituidas:{name:'ZRC constituidas',group:'main',color:'#7cb278',line:'#387b65',kind:'poly',visible:true,weight:1.6,opacity:.24},
 altamira:{name:'Revisión Resguardo Altamira',group:'main',color:'#e4a16c',line:'#b56b45',kind:'poly',visible:true,weight:2,opacity:.18},
 ajuste:{name:'Ajuste del polígono de la Zona de Reserva Campesina Cuenca del Río Pato y Valle de Balsillas',group:'main',color:'#e8c74e',line:'#a48e32',kind:'poly',visible:false,weight:1.8,opacity:.21},
 ley2:{name:'Zonificación Ley Segunda (2023)',group:'eco',color:'#c5aa7f',line:'#976d49',kind:'poly',visible:false,weight:1.2,opacity:.33},
 parques:{name:'Parques naturales',group:'eco',color:'#6f9f6b',line:'#517d55',kind:'poly',visible:false,weight:1.7,opacity:.31},
 paramos:{name:'Páramos',group:'eco',color:'#9c86bd',line:'#735e9a',kind:'poly',visible:false,weight:1.4,opacity:.28},
 resguardos:{name:'Resguardos indígenas formalizados',group:'com',color:'#da8d98',line:'#a95465',kind:'poly',visible:false,weight:1.5,opacity:.25},
 municipios:{name:'Límites municipales',group:'geo',color:'#9aaab3',line:'#d8e5ee',kind:'outline',visible:false,weight:1.2,opacity:0},
 veredas:{name:'Límites veredales',group:'geo',color:'#9bb4b8',line:'#d7e6e7',kind:'outline',visible:false,weight:.75,opacity:0},
 vias:{name:'Vías',group:'geo',color:'#e6ba78',line:'#e8be70',kind:'line',visible:false,weight:1.5,opacity:0},
 drenajes:{name:'Drenaje doble',group:'geo',color:'#68bfd9',line:'#4cadd3',kind:'poly',visible:false,weight:.9,opacity:.49}
};
const order=Object.keys(C);
const state={map:null,layers:{},selected:null,visible:new Set(),labels:null,home:null,base:null};
function showError(msg){$('map-error').textContent=msg;$('map-error').hidden=false;}
function getTile(which){
 const opts={maxZoom:19,keepBuffer:2,crossOrigin:true};
 if(which==='satellite')return L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',{
   ...opts,attribution:'Imágenes © Esri y colaboradores. Servicio sujeto a condiciones de uso.'
 });
 if(which==='openfreemap'){
   if(typeof L.maplibreGL!=='function')throw new Error('No se cargó el componente de mapas abiertos. Prueba el fondo satelital o revisa la conexión a internet.');
   return L.maplibreGL({style:'https://tiles.openfreemap.org/styles/positron'});
 }
 return null;
}
function setBase(){
 const sel=$('basemap');
 if(state.base){state.map.removeLayer(state.base);state.base=null;}
 $('map-error').hidden=true;
 try{
   state.base=getTile(sel.value);
   if(state.base){
     state.base.addTo(state.map);
     if(typeof state.base.bringToBack==='function')state.base.bringToBack();
     if(typeof state.base.on==='function'&&sel.value==='satellite'){
       let errors=0;
       state.base.on('tileerror',()=>{
         errors++;
         if(errors===6){
           showError('El fondo satelital no está disponible desde tu conexión. Cambia a «Mapa libre · OpenFreeMap» o «Sin mapa base».');
         }
       });
     }
   }
 }catch(err){
   console.warn('No se pudo activar el mapa base',err);
   sel.value='none';
   showError('El mapa base no se pudo cargar: '+err.message);
 }
}
function polygonStyle(id,feature){const c=C[id];const selected=state.selected?.layer===id&&state.selected?.feature===feature;
 let fill=c.color,stroke=c.line;
 if(id==='ley2'){
   const z=normalize(feature?.properties?.['Tipo de zonificación']);
   fill=z.includes('tipo a')?'#5ea578':z.includes('tipo b')?'#ebba65':z.includes('tipo c')?'#b494cd':c.color;
 }
 const isLine=c.kind==='line',isOutline=c.kind==='outline';
 return {color:selected?'#16364e':stroke,weight:selected?3.8:c.weight,opacity:isOutline?.86:1,fillColor:fill,fillOpacity:isOutline?0:(selected?.58:c.opacity),dashArray:id==='veredas'?'4 3':id==='municipios'?'7 3':id==='ajuste'?'5 3':null,interactive:true};
}
function featureTitle(id,p){return p.Nombre||p.Vereda||p.Municipio||p.Zona||p.Descripción||(id==='pretension'?'Pretensión ZRC':C[id].name);}
function popupHtml(id,p){const pairs=Object.entries(p).filter(([k,v])=>v!==''&&v!==null&&v!==undefined);
 const rows=pairs.slice(0,10).map(([k,v])=>`<div class="popup-field"><span>${clean(k)}</span><strong>${clean(v)}</strong></div>`).join('');
 return `<div class="popup-title">${clean(featureTitle(id,p))}</div><span class="popup-meta">${clean(C[id].name)}</span>${rows}`;
}
function setDetail(id,p){$('selection-status').textContent='ELEMENTO SELECCIONADO';
 $('detail').className='';
 $('detail').innerHTML=`<h3 class="detail-title">${clean(featureTitle(id,p))}</h3><span class="detail-kind">${clean(C[id].name)}</span>`+
 Object.entries(p).filter(([k,v])=>v!==''&&v!==null&&v!==undefined).slice(0,10).map(([k,v])=>`<div class="detail-entry"><span>${clean(k)}</span><strong>${clean(v)}</strong></div>`).join('');
}
function createLayer(id){
 const geo=DATA[id];const config=C[id];
 const canvas=L.canvas({padding:.55});
 const layer=L.geoJSON(geo,{renderer:canvas,style:f=>polygonStyle(id,f),onEachFeature:(f,l)=>{
   l.bindPopup(()=>popupHtml(id,f.properties),{maxWidth:350,autoPan:true});
   const title=featureTitle(id,f.properties);
   if(title)l.bindTooltip(String(title),{sticky:true,opacity:.95});
   l.on('click',e=>{
     L.DomEvent.stopPropagation(e);state.selected={layer:id,feature:f};setDetail(id,f.properties);
     for(const key of order)if(state.layers[key])state.layers[key].setStyle(g=>polygonStyle(key,g));
   });
 }});
 return layer;
}
function toFront(group){if(group&&typeof group.eachLayer==='function')group.eachLayer(l=>{if(typeof l.bringToFront==='function')l.bringToFront();});}
function addLayers(){
 // Order controls how overlapping polygons appear; the primary outline is also painted on top.
 for(const id of order){state.layers[id]=createLayer(id);if(C[id].visible){state.map.addLayer(state.layers[id]);state.visible.add(id);}}
 const outline=L.geoJSON(DATA.pretension,{style:{color:'#0d8198',weight:2.6,opacity:1,fill:false},interactive:false}).addTo(state.map);
 state.mainOutline=outline;
 state.home=state.layers.pretension.getBounds();
 state.map.fitBounds(state.home,{padding:[32,32],maxZoom:12});
 toFront(outline);
}
function drawControls(){for(const id of order){const c=C[id],container=$('group-'+c.group);
 const row=document.createElement('div');row.className='layer-row';
 const box=document.createElement('input');box.type='checkbox';box.id='layer-'+id;box.checked=c.visible;box.setAttribute('aria-label','Mostrar '+c.name);
 const label=document.createElement('label');label.htmlFor=box.id;label.className='layer-name';label.textContent=c.name;
 const swatch=document.createElement('i');swatch.className='layer-swatch';swatch.style.backgroundColor=c.kind==='line'||c.kind==='outline'?'transparent':c.color;swatch.style.borderColor=c.line;
 const zoom=document.createElement('button');zoom.type='button';zoom.className='layer-zoom';zoom.title='Acercar a '+c.name;zoom.setAttribute('aria-label','Acercar a '+c.name);zoom.textContent='⌖';
 box.addEventListener('change',()=>toggleLayer(id,box.checked));
 zoom.addEventListener('click',()=>{if(!box.checked){box.checked=true;toggleLayer(id,true);}const b=state.layers[id].getBounds();if(b.isValid())state.map.fitBounds(b,{maxZoom:13,padding:[30,30]});});
 row.append(box,label,swatch,zoom);container.append(row);
 }}
function toggleLayer(id,on){const layer=state.layers[id];if(!layer)return;
 if(on){state.map.addLayer(layer);state.visible.add(id);}else{state.map.removeLayer(layer);state.visible.delete(id);}
 if(state.mainOutline){
   if(state.visible.has('pretension')&&!state.map.hasLayer(state.mainOutline))state.map.addLayer(state.mainOutline);
   if(!state.visible.has('pretension')&&state.map.hasLayer(state.mainOutline))state.map.removeLayer(state.mainOutline);
   if(state.map.hasLayer(state.mainOutline))toFront(state.mainOutline);
 }
 // Render altamira and adjustments above pretension outline where present.
 for(const key of ['altamira','ajuste'])if(state.map.hasLayer(state.layers[key]))toFront(state.layers[key]);
 refreshLegend();syncVeredaLabels();
}
function refreshLegend(){const wrap=$('legend');wrap.innerHTML='';
 const h=document.createElement('div');h.className='legend-heading';h.textContent='Simbología visible';wrap.append(h);
 const content=document.createElement('div');content.className='legend-content';
 const active=order.filter(k=>state.visible.has(k));
 for(const id of active){const c=C[id];
  const r=document.createElement('div');r.className='legend-row';const sw=document.createElement('span');
  sw.style.background=c.kind==='line'||c.kind==='outline'?'transparent':c.color;
  sw.style.borderColor=c.line;sw.style.borderWidth=c.kind==='line'?'0 0 3px 0':'1px';
  const t=document.createElement('span');t.style.width='auto';t.style.height='auto';t.style.border='0';t.textContent=c.name;r.append(sw,t);content.append(r);
 }
 if(!active.length)content.innerHTML='<div class="legend-empty">Activa una capa en el panel lateral.</div>';
 wrap.append(content);
 $('visible-count').textContent=active.length+' '+(active.length===1?'capa activa':'capas activas');
}
function syncVeredaLabels(){const should=$('toggle-labels').checked&&state.map.getZoom()>=12;
 if(!state.labels)return;
 if(should&&!state.map.hasLayer(state.labels))state.map.addLayer(state.labels);
 if(!should&&state.map.hasLayer(state.labels))state.map.removeLayer(state.labels);
}
function makeLabels(){const group=L.layerGroup();
 DATA.veredas.features.forEach(f=>{
 const n=f.properties.Vereda;if(!n)return;
 const bounds=L.geoJSON(f).getBounds();if(!bounds.isValid())return;
 const marker=L.marker(bounds.getCenter(),{opacity:0,interactive:false,keyboard:false});
 marker.bindTooltip(String(n),{permanent:true,direction:'center',className:'vereda-tag',opacity:.95,offset:[0,0]});
 group.addLayer(marker);
 });state.labels=group;
}
function searchVeredas(){const query=normalize($('search-input').value),root=$('search-results');root.replaceChildren();
 if(!query){root.hidden=true;return;}
 const data=DATA.veredas.features.filter(f=>normalize(f.properties.Vereda+' '+(f.properties.Municipio||'')).includes(query)).slice(0,18);
 if(!data.length){const p=document.createElement('div');p.className='search-empty';p.textContent='No se encontraron veredas.';root.append(p);}
 for(const feature of data){const p=feature.properties,button=document.createElement('button');button.className='search-result';button.type='button';
  const b=document.createElement('strong');b.textContent=p.Vereda||'Sin nombre';const s=document.createElement('span');s.textContent=p.Municipio||'Municipio sin dato';button.append(b,s);
  button.addEventListener('click',()=>{
   if(!state.visible.has('veredas')){$('layer-veredas').checked=true;toggleLayer('veredas',true);}
   const bounds=L.geoJSON(feature).getBounds();if(bounds.isValid())state.map.fitBounds(bounds,{padding:[35,35],maxZoom:14});
   setDetail('veredas',p);$('search-results').hidden=true;
  });root.append(button);
 }
 root.hidden=false;
}
function resetLayers(){for(const id of order){const checked=C[id].visible;$('layer-'+id).checked=checked;toggleLayer(id,checked);}$('toggle-labels').checked=false;syncVeredaLabels();$('search-input').value='';$('search-results').hidden=true;}

function setupWelcome(){
 const splash=$('welcome-screen'),button=$('enter-visor');
 if(!splash||!button)return;
 const openViewer=()=>{
   splash.hidden=true;
   document.body.classList.remove('welcome-open');
   if(state.map){
     requestAnimationFrame(()=>state.map.invalidateSize({pan:false}));
     setTimeout(()=>state.map.invalidateSize({pan:false}),250);
   }
 };
 button.addEventListener('click',openViewer);
 button.focus({preventScroll:true});
}

function init(){
 if(typeof L==='undefined'){showError('No se pudo cargar Leaflet. Conéctate a internet y vuelve a abrir el visor.');return;}
 if(!DATA||!DATA.pretension||!DATA.veredas){showError('No se encontraron los datos incorporados. Descomprime completamente el ZIP y conserva la carpeta data.');return;}
 state.map=L.map('map',{zoomControl:false,preferCanvas:true,zoomSnap:.5,zoomDelta:.5,worldCopyJump:false});
 L.control.zoom({position:'topright'}).addTo(state.map);
 L.control.scale({position:'bottomleft',metric:true,imperial:false,maxWidth:110}).addTo(state.map);
 setBase();drawControls();addLayers();makeLabels();refreshLegend();
 $('basemap').addEventListener('change',setBase);
 $('btn-home').addEventListener('click',()=>state.map.fitBounds(state.home,{padding:[32,32]}));
 $('btn-fit').addEventListener('click',()=>state.map.fitBounds(state.home,{padding:[32,32]}));
 $('btn-clear').addEventListener('click',resetLayers);
 $('toggle-labels').addEventListener('change',syncVeredaLabels);
 state.map.on('zoomend',syncVeredaLabels);
 state.map.on('mousemove',e=>{$('coords').textContent=`${e.latlng.lat.toFixed(5)}, ${e.latlng.lng.toFixed(5)}`;});
 $('search-button').addEventListener('click',searchVeredas);
 $('search-input').addEventListener('input',searchVeredas);
 $('search-input').addEventListener('keydown',e=>{if(e.key==='Enter')searchVeredas();});
 window.addEventListener('resize',()=>state.map.invalidateSize());
 console.info('Comisión Río Pato v0.2 · datos locales',Object.fromEntries(Object.keys(DATA).map(k=>[k,DATA[k].features.length])));
}
window.addEventListener('DOMContentLoaded',()=>{setupWelcome();try{init();}catch(err){console.error(err);showError('No se pudo iniciar el visor: '+err.message);}});
})();
