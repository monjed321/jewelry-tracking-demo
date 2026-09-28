
(() => {
  'use strict';
  const KEY = 'tracking_demo_v1_data';
  const VERSION = 1;
  const tables = ['customers','orders','order_items','order_images','order_catalog_items',
    'catalog_models','order_pickups','engraving_order_details','repair_order_details',
    'catalog_order_details','watch_types'];
  const clone = value => JSON.parse(JSON.stringify(value));
  const id = () => crypto.randomUUID ? crypto.randomUUID() : 'demo-' + Date.now() + '-' + Math.random().toString(36).slice(2);
  const date = days => new Date(Date.now() - days * 86400000).toISOString();
  function seed() {
    const state = {version:VERSION, files:{}};
    for (const table of tables) state[table] = [];
    state.customers = [1,2,3].map(n => ({id:'customer-'+n,full_name:'عميل تجريبي '+n,
      phone_number:'000000000'+n,address:'عنوان تجريبي '+n,created_at:date(n)}));
    const catalog = [
      ['children-bracelets','سوار تجريبي','bracelet'],['names','قلادة حروف تجريبية','pendant'],
      ['children-earrings','أقراط تجريبية','earrings'],['pictures','تعليقة هندسية تجريبية','charm']
    ];
    state.catalog_models = catalog.map(([cat,name,art],i)=>({id:'model-'+(i+1),model_name:name,
      model_number:'DEMO-10'+(i+1),demo_category:cat,image_url:'assets/'+cat+'/'+art+'.svg',created_at:date(i)}));
    state.orders = ['repair','engraving','catalog','renewal'].map((type,i)=>({
      id:'order-'+(i+1),order_number:'DEMO-100'+(i+1),order_type:type,
      customer_id:state.customers[i%3].id,customer_name_snapshot:state.customers[i%3].full_name,
      customer_phone_snapshot:state.customers[i%3].phone_number,status:i===1?'completed':'in_progress',
      tracking_code:String(100001+i),priority:i===0?'ضروري جدا':i===3?'ضروري':'عادي',whatsapp_enabled:false,
      notes:'بيانات مصطنعة للعرض فقط',image_url:i===2?state.catalog_models[0].image_url:null,
      created_at:date(i+1),updated_at:date(i),completed_at:i===1?date(1):null
    }));
    state.order_items = [
      {id:'item-1',order_id:'order-1',sort_order:0,item_type:'خاتم',gold_karat:'21',gold_weight:3.5,problem_description:'تعديل المقاس',notes:'مثال تجريبي'},
      {id:'item-2',order_id:'order-2',sort_order:0,item_type:'قلادة',gold_karat:'18',gold_weight:2.7,engraving_text:'DEMO',notes:'مثال تجريبي'},
      {id:'item-4',order_id:'order-4',sort_order:0,item_type:'سوار',problem_description:'تلميع وتجديد القطعة',notes:'مثال تجريبي'}
    ];
    state.order_catalog_items = [{id:'catalog-item-1',order_id:'order-3',catalog_model_id:'model-1',
      model_name_snapshot:state.catalog_models[0].model_name,model_number_snapshot:'DEMO-101',
      image_url_snapshot:state.catalog_models[0].image_url,quantity:1,gold_karat:'21',gold_weight:4,sort_order:0}];
    state.watch_types = ['Classic','Sport','Digital'].map((name,i)=>({id:'watch-'+i,name,sort_order:i}));
    return state;
  }
  let memory = seed(), persistent = true;
  try {
    const saved = localStorage.getItem(KEY);
    if (saved) {const parsed=JSON.parse(saved); if(parsed.version===VERSION) memory=parsed;}
    localStorage.setItem(KEY,JSON.stringify(memory));
  } catch (_) { persistent = false; }
  function read() {
    if(persistent) { const saved=localStorage.getItem(KEY); if(saved) memory=JSON.parse(saved); }
    return clone(memory);
  }
  function write(state) {

    if(persistent) {
      try { localStorage.setItem(KEY,JSON.stringify(state)); }
      catch (_) { throw new Error('تعذر حفظ البيانات في المتصفح. قلّل الصور أو أعد ضبط التجربة.'); }
    }
    memory=clone(state);
    window.dispatchEvent(new Event('demo-data-change'));
  }
  class Query {
    constructor(table){this.table=table;this.filters=[];this.sorts=[];this.op='read';this.fields='*';}
    select(fields='*'){this.fields=fields;return this;}
    eq(key,value){this.filters.push(row=>row[key]===value);return this;}
    in(key,values){this.filters.push(row=>values.includes(row[key]));return this;}
    order(key,options={}){this.sorts.push([key,options.ascending!==false]);return this;}
    insert(rows){this.op='insert';this.values=Array.isArray(rows)?rows:[rows];return this;}
    update(values){this.op='update';this.values=values;return this;}
    delete(){this.op='delete';return this;}
    single(){this.one='required';return this;}
    maybeSingle(){this.one='optional';return this;}
    limit(n){this.max=n;return this;}
    then(resolve,reject){return this.execute().then(resolve,reject);}
    async execute(){
      try {
        if(!tables.includes(this.table)) throw new Error('Unknown demo collection: '+this.table);
        const state=read(), match=row=>this.filters.every(test=>test(row));
        let rows;
        if(this.op==='insert') {
          rows=this.values.map(v=>({id:id(),created_at:date(0),...clone(v)}));
          if(this.table==='order_pickups' && rows.some(row=>state.order_pickups.some(p=>p.order_id===row.order_id)))
            return {data:null,error:{code:'23505',message:'تم تسجيل الاستلام مسبقاً'}};
          if(this.table==='watch_types' && rows.some(row=>state.watch_types.some(w=>w.name.toLowerCase()===row.name.toLowerCase())))
            return {data:null,error:{code:'23505',message:'النوع موجود بالفعل'}};
          if(this.table==='orders')for(const row of rows)row.tracking_code=String(100000+state.orders.length+rows.indexOf(row)+1);
          state[this.table].push(...rows);write(state);
        } else if(this.op==='update') {
          rows=state[this.table].filter(match);
          for(const row of rows){
            if(this.table==='orders' && this.values.status && this.values.status!==row.status)
              row.completed_at=this.values.status==='completed'?date(0):null;
            Object.assign(row,clone(this.values),{updated_at:date(0)});
          }
          write(state);
        } else if(this.op==='delete') {
          rows=state[this.table].filter(match);
          state[this.table]=state[this.table].filter(row=>!match(row));
          if(this.table==='catalog_models') for(const row of rows)
            if(row.demo_storage_path)delete state.files['cataloge-img/'+row.demo_storage_path];
          if(this.table==='orders') {
            const ids=rows.map(row=>row.id);
            for(const table of ['order_items','order_images','order_catalog_items','order_pickups','engraving_order_details','repair_order_details','catalog_order_details'])
              state[table]=state[table].filter(row=>!ids.includes(row.order_id));
          }
          write(state);
        } else rows=state[this.table].filter(match);
        rows=clone(rows);
        rows.sort((a,b)=>{for(const [key,ascending] of this.sorts){const av=a[key]??'',bv=b[key]??'';
          const cmp=typeof av==='number' && typeof bv==='number'?av-bv:String(av).localeCompare(String(bv),'ar');
          if(cmp)return ascending?cmp:-cmp;}return 0;});
        if(this.max)rows=rows.slice(0,this.max);
        if(this.fields!=='*') {const fields=this.fields.split(',').map(f=>f.trim());rows=rows.map(row=>Object.fromEntries(fields.map(f=>[f,row[f]])));}
        if(this.one){if(rows.length>1 || (this.one==='required'&&!rows.length))throw new Error('السجل المطلوب غير متاح');
          return {data:rows[0]||null,error:null};}
        return {data:rows,error:null};
      } catch(error){return {data:null,error:{message:error.message}};}
    }
  }
  async function encodeImage(file) {
    if(!/^image\/(png|jpeg|webp|gif)$/.test(file.type))throw new Error('اختر صورة PNG أو JPG أو WEBP أو GIF.');
    if(file.size>8*1024*1024)throw new Error('حجم الصورة أكبر من 8 ميغابايت.');
    const url=URL.createObjectURL(file);
    try {
      const img=new Image();img.src=url;await img.decode();
      const ratio=Math.min(1,1000/Math.max(img.naturalWidth,img.naturalHeight));
      const canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(img.naturalWidth*ratio));
      canvas.height=Math.max(1,Math.round(img.naturalHeight*ratio));
      canvas.getContext('2d').drawImage(img,0,0,canvas.width,canvas.height);
      return canvas.toDataURL('image/jpeg',.78);
    } finally {URL.revokeObjectURL(url);}
  }
  const storage={from(bucket){return {
    async upload(path,file){try{const data=await encodeImage(file),state=read();state.files[bucket+'/'+path]=data;write(state);return {data:{path},error:null};}
      catch(error){return {data:null,error:{message:error.message}};}},
    getPublicUrl(path){return {data:{publicUrl:read().files[bucket+'/'+path]||''}};},
    async remove(paths){try{const state=read();for(const p of paths)delete state.files[bucket+'/'+p];write(state);return {data:[],error:null};}
      catch(error){return {data:null,error:{message:error.message}};}},
    async list(){return {data:[],error:null};}
  };}};
  window.DemoStore={from:table=>new Query(table),storage,persistent,
    snapshot:()=>read(),key:KEY,
    reset(){
      if(persistent){for(const k of Object.keys(localStorage))if(k.startsWith('tracking_demo_') && k!==KEY)localStorage.removeItem(k);}
      write(seed());
    }
  };
  window.addEventListener('storage',event=>{if(event.key===KEY)window.dispatchEvent(new Event('demo-external-change'));});
})();
