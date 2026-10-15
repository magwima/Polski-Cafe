const day=(d=new Date())=>d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0");
function setup(){chrome.alarms.get("pwk-check",a=>{if(!a)chrome.alarms.create("pwk-check",{delayInMinutes:1,periodInMinutes:30})})}
chrome.runtime.onInstalled.addListener(setup);
chrome.runtime.onStartup.addListener(setup);
chrome.alarms.onAlarm.addListener(async a=>{
  if(a.name!=="pwk-check")return;
  const now=new Date();if(now.getHours()<18||now.getHours()>=22)return;
  const {pwk={},pwkNotified}=await chrome.storage.local.get(["pwk","pwkNotified"]);
  const today=day();
  if(pwk.remind===false||pwk.last===today||pwkNotified===today)return;
  const y=new Date();y.setDate(y.getDate()-1);
  const live=pwk.last===day(y)&&pwk.streak>0;
  chrome.notifications.create("pwk-remind",{type:"basic",iconUrl:"icons/icon128.png",title:"Czas na polski! 🌱",
    message:live?`Keep your ${pwk.streak}-day streak going. One round takes about 3 minutes.`:"One quick round takes about 3 minutes.",priority:0});
  await chrome.storage.local.set({pwkNotified:today});
});
chrome.notifications.onClicked.addListener(id=>{if(id==="pwk-remind"){chrome.tabs.create({url:chrome.runtime.getURL("game.html")});chrome.notifications.clear(id)}});
