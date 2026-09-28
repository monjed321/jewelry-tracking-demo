(() => {
  const orderId = new URLSearchParams(location.search).get('order');
  const day = value => value ? new Date(value).toLocaleDateString('ar') : '';
  function refreshTracking() {
    const state = DemoStore.snapshot();
    const order = state.orders.find(o => o.id === orderId);
    if (!order) {
      document.getElementById('view-order').classList.remove('on');
      document.getElementById('view-verify').classList.add('on');
      document.getElementById('track-empty').textContent = orderId
        ? 'هذه الطلبية غير موجودة في بيانات هذا المتصفح، أو حُذفت. اختر طلبية من الإدارة أو أعد ضبط التجربة.'
        : 'اختر طلبية من صفحة الإدارة لعرض تفاصيلها التجريبية.';
      return;
    }
    const images = state.order_images.filter(i => i.order_id === order.id);
    const pieces = state.order_items.filter(i => i.order_id === order.id).sort((a,b) => a.sort_order-b.sort_order);
    const models = state.order_catalog_items.filter(i => i.order_id === order.id);
    const pickup = state.order_pickups.find(p => p.order_id === order.id);
    const types = {repair:'تصليح',engraving:'حفر',renewal:'تجديد',catalog:'كتالوج'};
    render({
      customer_name:order.customer_name_snapshot, order_number:order.order_number,
      created_date:day(order.created_at),order_type:order.order_type,order_type_ar:types[order.order_type] || order.order_type,
      status:pickup?'picked_up':order.status,completed_date:day(order.completed_at),picked_date:day(pickup?.created_at),
      pieces_count:pieces.length+models.reduce((sum,m)=>sum+Number(m.quantity||1),0),
      pieces:pieces.map(p=>({item_type:p.item_type,karat:p.gold_karat,weight:p.gold_weight,problem:p.problem_description,
        engraving:p.engraving_text,images:images.filter(i=>i.item_id===p.id).map(i=>i.image_url)})),
      models:models.map(m=>({name:m.model_name_snapshot,number:m.model_number_snapshot,image:m.image_url_snapshot,
        quantity:m.quantity,karat:m.gold_karat,weight:m.gold_weight})),
      order_images:images.filter(i=>!i.item_id).map(i=>i.image_url)
    });
  }
  refreshTracking();
  window.addEventListener('demo-external-change',refreshTracking);
  window.addEventListener('demo-data-change',refreshTracking);
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)refreshTracking();});
})();
