(() => {
  const foods = [
    ['Arroz branco cozido',128,2.5,28.1,.2],['Arroz integral cozido',124,2.6,25.8,1],['Peito de frango grelhado',159,32,0,2.5],['Patinho grelhado',219,35.9,0,7.3],['Tilápia grelhada',154,31.4,0,2.2],['Salmão grelhado',229,25.4,0,14.2],['Ovo inteiro cozido',146,13.3,.6,9.5],['Clara de ovo cozida',52,11,.7,.2],['Feijão carioca cozido',76,4.8,13.6,.5],['Lentilha cozida',93,6.3,16.3,.5],['Tofu',76,8.1,1.9,4.8],['Iogurte natural',61,3.5,4.7,3.3],['Cottage',98,11,3.4,4.3],['Whey protein (pó)',400,80,8,6],['Aveia em flocos',394,13.9,66.6,8.5],['Pão integral',253,9.4,44.1,3.7],['Batata-doce cozida',76,.6,18.4,.1],['Macarrão cozido',102,3.2,19.9,.5],['Banana prata',98,1.3,26,.1],['Abacate',96,1.2,6,8.4],['Brócolis cozido',25,2.1,4.4,.5],['Azeite de oliva',884,0,0,100]
  ].map(([name,kcal,p,c,f]) => ({name,kcal,p,c,f}));
  const meals = ['Café da manhã','Almoço','Lanche','Jantar','Pós-treino'];
  const todayKey = (date=new Date()) => `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
  const weekStartKey = (date=new Date()) => { const monday=new Date(date.getFullYear(),date.getMonth(),date.getDate()); monday.setDate(monday.getDate()-((monday.getDay()+6)%7)); return todayKey(monday); };
  const exerciseCatalog = [
    ['Supino reto','Peito','Barra'],['Supino inclinado com halteres','Peito','Halteres'],['Crucifixo na polia','Peito','Polia'],['Flexão de braço','Peito','Peso corporal'],
    ['Remada curvada','Costas','Barra'],['Remada baixa','Costas','Polia'],['Puxada frontal','Costas','Polia'],['Levantamento terra romeno','Pernas','Barra'],
    ['Desenvolvimento com halteres','Ombros','Halteres'],['Elevação lateral','Ombros','Halteres'],['Rosca direta','Bíceps','Barra'],['Rosca martelo','Bíceps','Halteres'],
    ['Tríceps na corda','Tríceps','Polia'],['Agachamento livre','Pernas','Barra'],['Leg press','Pernas','Máquina'],['Cadeira extensora','Pernas','Máquina'],
    ['Mesa flexora','Pernas','Máquina'],['Panturrilha em pé','Pernas','Máquina'],['Prancha','Core','Peso corporal'],['Abdominal crunch','Core','Peso corporal']
  ].map(([name,muscle,equipment],index)=>({id:`ex-${index+1}`,name,muscle,equipment}));

  const base = {
    food: [], goals: { kcal: 2600, protein: 150, carbs: 330, fat: 75 }, profile: { weight: 75, proteinFactor: 1.8 }, achievementLog: {}, preferences:{theme:'white'}, spotifyPlaylists:{white:'',dark:'',red:''},
    recovery: { bedtime: '23:00', wake: '07:00', sleepGoal: 8, awake: 15, quality: 8, stress: 4, water: 2.5, history: [7.1, 7.5, 6.8, 7.8, 7.3, 7.6] },
    focus: { screen: 3.2, deep: 90, reading: 20, steps: 7000 },
    training: { completed: false, workouts: [], activeWorkoutId: null, currentDay:null, turbo:{active:false,running:false,remaining:2700,endsAt:null} }, supplements: { 'Creatina': false, 'Whey protein': false, 'Ômega-3': false, 'Cafeína': false },
    tasks: [{ text: 'Planejar refeições de amanhã', done: false }, { text: 'Separar a roupa de treino', done: true }]
  };
  const $ = s => document.querySelector(s);
  const $$ = s => [...document.querySelectorAll(s)];
  const number = n => new Intl.NumberFormat('pt-BR',{maximumFractionDigits:0}).format(n || 0);
  const decimal = n => new Intl.NumberFormat('pt-BR',{maximumFractionDigits:1}).format(n || 0);
  const esc = text => String(text).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  const hydrate = source => {
    const training={...base.training,...source?.training,workouts:Array.isArray(source?.training?.workouts)?source.training.workouts:base.training.workouts,turbo:{...base.training.turbo,...source?.training?.turbo}};
    if(training.currentDay!==todayKey()){training.currentDay=todayKey();training.completed=false;}
    return {...base,...source,goals:{...base.goals,...source?.goals},profile:{...base.profile,...source?.profile},preferences:{...base.preferences,...source?.preferences},spotifyPlaylists:{...base.spotifyPlaylists,...source?.spotifyPlaylists},recovery:{...base.recovery,...source?.recovery},focus:{...base.focus,...source?.focus},training,achievementLog:{...source?.achievementLog},achievements:{...source?.achievements,unlocked:{...source?.achievements?.unlocked}},supplements:{...base.supplements,...source?.supplements},food:Array.isArray(source?.food)?source.food.map(item=>({...item,date:item.date||todayKey()})):base.food,tasks:Array.isArray(source?.tasks)?source.tasks:base.tasks};
  };
  let state = hydrate(JSON.parse(localStorage.getItem('fitpulse-v2') || 'null'));
  let activeUser = null;
  let draftExercises = [];
  let editingWorkoutId = null;
  let toastTimer;

  function persist(message) {
    localStorage.setItem('fitpulse-v2', JSON.stringify(state));
    $('#syncState').textContent = activeUser ? 'Salvando…' : 'Somente neste dispositivo';
    Promise.resolve(window.fitpulseFirebase?.save?.(state)).then(() => {
      $('#syncState').textContent = activeUser ? 'Sincronizado' : 'Somente neste dispositivo';
    }).catch(() => $('#syncState').textContent = 'Salvo localmente');
    if (message) notify(message);
  }
  function notify(message) { const t = $('#toast'); t.textContent = message; t.classList.add('show'); clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove('show'), 3200); }
  function themeName(){return ({white:'WHITE',dark:'DARK',red:'RED'})[state.preferences.theme]||'WHITE';}
  function setTheme(theme,save=true){if(!['white','dark','red'].includes(theme))return;state.preferences.theme=theme;document.body.dataset.theme=theme;document.querySelector('meta[name=theme-color]').content=theme==='red'?'#19080c':theme==='dark'?'#111019':'#f7f5fa';$$('[data-theme-choice]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.themeChoice===theme)));if(theme==='red'&&!state.training.turbo.active){state.training.turbo.active=true;if(state.training.turbo.remaining<=0)state.training.turbo.remaining=2700;}renderOverview();renderTraining();drawMacro(totals());drawSleepWeek([...state.recovery.history.slice(-6),sleepHours()],state.recovery.sleepGoal);renderSpotify();if(save)persist(`Tema ${themeName()} ativado.`);}
  function spotifyEmbed(url){try{const parsed=new URL(url);if(parsed.hostname!=='open.spotify.com')return null;const match=parsed.pathname.match(/^\/(?:embed\/)?playlist\/([A-Za-z0-9]+)\/?$/);return match?`https://open.spotify.com/embed/playlist/${match[1]}?utm_source=generator`:null;}catch{return null;}}
  function renderSpotify(){const mode=state.preferences.theme||'white',url=state.spotifyPlaylists[mode]||'',src=url?spotifyEmbed(url):null;$('#spotifyActiveMode').textContent=themeName();$('#spotifyPlaylistUrl').value=url;$('#spotifyFeedback').textContent=url&&!src?'Link salvo inválido. Cole o endereço de uma playlist do Spotify.':src?`Playlist pronta para o modo ${themeName()}.`: `Cole o link de uma playlist para o modo ${themeName()}.`;$('#spotifyEmbedWrap').classList.toggle('hidden',!src);if(src&&$('#spotifyFrame').src!==src)$('#spotifyFrame').src=src;else if(!src)$('#spotifyFrame').removeAttribute('src');}
  function formatClock(seconds){const mins=Math.floor(Math.max(0,seconds)/60),secs=Math.max(0,seconds)%60;return `${String(mins).padStart(2,'0')}:${String(secs).padStart(2,'0')}`;}
  function renderTurbo(){const t=state.training.turbo;$('#turboPanel').classList.toggle('hidden',!t.active);$('#turboCountdown').textContent=formatClock(t.running?Math.max(0,Math.ceil((t.endsAt-Date.now())/1000)):t.remaining);$('#turboAction').textContent=t.running?'Pausar sprint':t.remaining<2700?'Retomar sprint':'Iniciar 45 min';$('#turboStatus').textContent=t.running?'Foco ligado. Controle a execução e respeite suas pausas.':t.remaining===0?'Sprint concluído. Recupere a respiração e registre como foi.':'Sprint de foco pronto. Ajuste a carga com controle e priorize a técnica.';$('#openTurboButton').textContent=t.active?'⚡ Turbo preparado':'⚡ Modo turbo';document.body.classList.toggle('turbo-active',t.active&&state.preferences.theme==='red');}
  function currentFood() { return state.food.filter(food=>food.date===todayKey()); }
  function totalsFor(items) { return items.reduce((out, food) => ({kcal:out.kcal+food.kcal, protein:out.protein+food.p, carbs:out.carbs+food.c, fat:out.fat+food.f}), {kcal:0,protein:0,carbs:0,fat:0}); }
  function totals() { return totalsFor(currentFood()); }
  function timeInBed() { const [bh,bm] = state.recovery.bedtime.split(':').map(Number); const [wh,wm] = state.recovery.wake.split(':').map(Number); let start = bh*60+bm, end = wh*60+wm; if (end <= start) end += 1440; return (end-start)/60; }
  function sleepHours() { return Math.max(0, timeInBed() - (Number(state.recovery.awake) || 0) / 60); }
  function duration(minutes) { const h=Math.floor(minutes/60), m=Math.round(minutes%60); return `${h} h ${m} min`; }
  function regularity() { const baseTime=23*60, current=state.recovery.bedtime.split(':').map(Number); const diff=Math.abs((current[0]*60+current[1])-baseTime); return Math.max(55,Math.round(100-Math.min(45,diff/3))); }
  function readiness() { const r=state.recovery, sleep=sleepHours(); return Math.round(Math.min(100,Math.max(0,sleep/r.sleepGoal*42+r.quality/10*34+(10-r.stress)/10*24))); }
  function dayScore() { const t=totals(), sleep=sleepHours(), f=state.focus; return Math.round(Math.min(100, 15 + Math.min(35,t.protein/state.goals.protein*35) + Math.min(22,sleep/state.recovery.sleepGoal*22) + Math.min(14,(10-state.recovery.stress)/8*14) + (state.training.completed?8:0) + Math.max(0,6-(Math.max(0,f.screen-3)*2)))); }
  function meter(id, value) { $(id).style.width = `${Math.min(100,Math.max(0,value))}%`; }

  function renderOverview() {
    const t=totals(), r=readiness(), sleep=sleepHours(), s=dayScore();
    const redMotivation=['Foco na técnica. Uma repetição consciente de cada vez.','A consistência de hoje constrói sua força de amanhã.','Respire, estabilize e execute com intenção.','Ritmo firme. Forma limpa. Termine mais forte.'];const redIndex=(new Date().getDate()-1)%redMotivation.length;$('#redMotivation').classList.toggle('hidden',state.preferences.theme!=='red');$('#redMotivation').textContent=redMotivation[redIndex];
    $('#proteinMetric').textContent=`${decimal(t.protein)} g`; $('#proteinGoal').textContent=`meta: ${number(state.goals.protein)} g`; meter('#proteinMeter',t.protein/state.goals.protein*100);
    $('#calorieMetric').textContent=`${number(t.kcal)} kcal`; $('#calorieGoal').textContent=`meta: ${number(state.goals.kcal)} kcal`; meter('#calorieMeter',t.kcal/state.goals.kcal*100);
    $('#sleepMetric').textContent=`${decimal(sleep)} h`; $('#sleepGoal').textContent=`meta: ${decimal(state.recovery.sleepGoal)} h`; meter('#sleepMeter',sleep/state.recovery.sleepGoal*100);
    $('#screenMetric').textContent=`${decimal(state.focus.screen)} h`; $('#screenGoal').textContent=state.focus.screen<=3?'dentro da meta':'acima da meta de 3 h'; meter('#screenMeter',Math.max(0,100-(Math.max(0,state.focus.screen-3)*25)));
    $('#readinessNumber').textContent=r; $('#readinessLabel').textContent=r>=75?'boa para manter carga':r>=55?'ajuste conforme resposta':'priorize recuperação';
    $('#greeting').textContent=s>=80?'Você está conduzindo bem o seu dia.':s>=55?'Pequenas ações ainda mudam o seu dia.':'Vamos construir o básico primeiro.';
    $('#coachNote').textContent=t.protein < state.goals.protein*.45 ? 'Prioridade: organize uma fonte proteica para a próxima refeição.' : !state.training.completed ? 'Nutrição encaminhada. Confirme ou programe seu treino de hoje.' : 'Treino concluído. Proteja o sono para consolidar a recuperação.';
    const steps = [
      [t.protein>=state.goals.protein*.75,'Proteína',`${decimal(t.protein)} g de ${number(state.goals.protein)} g`],
      [state.training.completed,'Treino','Marque a sessão quando terminar'],
      [sleep>=7,'Sono',`${decimal(sleep)} h registradas`],
      [state.focus.screen<=3,'Tempo de tela',`${decimal(state.focus.screen)} h hoje`]
    ];
    $('#todaySteps').innerHTML=steps.map(([done,title,sub])=>`<div class="today-step"><span class="step-icon">${done?'✓':'→'}</span><div><b>${title}</b><small>${sub}</small></div></div>`).join('');
    const recent = currentFood().slice(-5).reverse();
    $('#overviewMeals').innerHTML=recent.length?`<div class="summary-row muted"><span>REFEIÇÃO</span><span>ALIMENTO</span><span>QUANTIDADE</span><span>PROTEÍNA</span></div>${recent.map(x=>`<div class="summary-row"><b>${esc(x.meal)}</b><span>${esc(x.name)}</span><span>${x.grams} g</span><span>${decimal(x.p)} g</span></div>`).join('')}`:'<p class="empty-state">Seu diário ainda está vazio. Registre a primeira refeição para ver um resumo aqui.</p>';
    drawConsistency(s);
  }
  function renderNutrition() {
    const t=totals(), totalsList=[['ENERGIA',t.kcal,state.goals.kcal,'kcal'],['PROTEÍNA',t.protein,state.goals.protein,'g'],['CARBOIDRATOS',t.carbs,state.goals.carbs,'g'],['GORDURAS',t.fat,state.goals.fat,'g']];
    $('#goalStrip').innerHTML=totalsList.map(([label,val,goal,unit])=>`<div class="goal-stat"><span>${label}</span><b>${number(val)} ${unit}</b><small>de ${number(goal)} ${unit}</small></div>`).join('');
    $('#mealList').innerHTML=meals.map(meal => { const items=state.food.map((x,i)=>({...x,i})).filter(x=>x.date===todayKey()&&x.meal===meal); const sum=items.reduce((a,x)=>a+x.p,0); return `<article class="meal-card"><div class="meal-head"><div><h3>${meal}</h3><small>${items.length?`${items.length} item(ns) · ${decimal(sum)} g de proteína`:'Nenhum alimento registrado'}</small></div><button class="text-button" data-add-meal="${meal}">+ adicionar</button></div>${items.map(x=>`<div class="meal-row"><div><b>${esc(x.name)}</b><small>${x.grams} g</small></div><span>${number(x.kcal)} kcal</span><span>${decimal(x.p)} g prot.</span><span>${decimal(x.c)} g carb.</span><button class="delete-food" data-delete-food="${x.i}" aria-label="Remover ${esc(x.name)}">×</button></div>`).join('')}</article>`; }).join('');
    $('#bodyWeight').value=state.profile.weight; $('#proteinFactor').value=state.profile.proteinFactor;
    const target=Math.round(state.profile.weight*state.profile.proteinFactor); $('#proteinCalculation').textContent=`${decimal(state.profile.weight)} kg × ${decimal(state.profile.proteinFactor)} g/kg = ${target} g de proteína/dia`;
    $('#supplementList').innerHTML=Object.entries(state.supplements).map(([name,on])=>`<div class="supplement"><span>${name}</span><button class="toggle ${on?'on':''}" data-supplement="${esc(name)}" aria-label="Registrar ${esc(name)}"><i></i></button></div>`).join('');
    $('#foodInput').innerHTML=foods.map((food,i)=>`<option value="${i}">${food.name}</option>`).join('');
    renderFoodPreview(); drawMacro(t);
  }
  const makeId = prefix => `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,8)}`;
  function openWorkoutBuilder(workout=null) {
    editingWorkoutId=workout?.id||null;
    draftExercises=workout?workout.exercises.map(item=>({...item})): [];
    $('#workoutName').value=workout?.name||'';
    $('#workoutSchedule').value=workout?.schedule||'';
    $('#workoutNotes').value=workout?.notes||'';
    $('#builderEyebrow').textContent=workout?'EDITAR FICHA':'NOVA FICHA';
    $('#builderTitle').textContent=workout?'Atualize seu treino':'Monte seu treino';
    $('#saveWorkoutButton').textContent=workout?'Salvar alterações':'Salvar ficha';
    $('#trainingBuilder').classList.remove('hidden');
    renderExerciseCatalog();
    renderWorkoutDraft();
    $('#trainingBuilder').scrollIntoView({behavior:'smooth',block:'start'});
  }
  function renderExerciseCatalog() {
    const root=$('#exerciseCatalog'); if(!root)return;
    const query=$('#exerciseSearch').value.trim().toLocaleLowerCase('pt-BR');
    const muscle=$('#exerciseMuscleFilter').value;
    const items=exerciseCatalog.filter(x=>(!muscle||x.muscle===muscle)&&(!query||`${x.name} ${x.muscle} ${x.equipment}`.toLocaleLowerCase('pt-BR').includes(query)));
    root.innerHTML=items.length?items.map((x,i)=>`<article class="library-exercise"><div><b>${esc(x.name)}</b><small>${esc(x.muscle)} · ${esc(x.equipment)}</small></div><button type="button" class="text-button" data-add-exercise="${esc(x.id)}">Adicionar</button></article>`).join(''):'<p class="empty-state">Nenhum exercício encontrado.</p>';
  }
  function renderWorkoutDraft() {
    const root=$('#workoutDraftList'); if(!root)return;
    $('#draftCount').textContent=`${draftExercises.length} ${draftExercises.length===1?'exercício':'exercícios'}`;
    root.innerHTML=draftExercises.length?draftExercises.map((x,i)=>`<article class="draft-exercise"><div class="draft-exercise-head"><div><b>${esc(x.name)}</b><small>${esc(x.muscle)} · ${esc(x.equipment)}</small></div><div class="draft-actions"><button type="button" class="text-button" data-video-query="${encodeURIComponent(x.name)}">Ver execução</button><button type="button" class="delete-food" data-remove-exercise="${esc(x.id)}" aria-label="Remover ${esc(x.name)}">×</button></div></div><div class="draft-fields"><label>Séries<input type="number" min="1" max="20" data-draft-id="${esc(x.id)}" data-draft-field="sets" value="${Number(x.sets)||3}"></label><label>Repetições<input maxlength="20" data-draft-id="${esc(x.id)}" data-draft-field="reps" value="${esc(x.reps||'8–12')}"></label><label>Carga (kg)<input type="number" min="0" max="1000" step="0.5" data-draft-id="${esc(x.id)}" data-draft-field="load" value="${esc(x.load||'')}" placeholder="Opcional"></label><label>Descanso (s)<input type="number" min="0" max="900" step="15" data-draft-id="${esc(x.id)}" data-draft-field="rest" value="${Number(x.rest)||90}"></label></div></article>`).join(''):'<p class="empty-state">Adicione exercícios da biblioteca para começar a ficha.</p>';
  }
  function renderSavedWorkouts() {
    const root=$('#savedWorkoutList'); if(!root)return;
    root.innerHTML=state.training.workouts.length?'<div class="saved-workout-grid">'+state.training.workouts.map(workout=>`<article class="saved-workout"><div class="saved-workout-head"><div><h4>${esc(workout.name)}</h4><small>${esc(workout.schedule||'Sem dia definido')}</small></div><span class="badge">${workout.exercises.length} exercícios</span></div><p class="saved-workout-note">${esc(workout.notes||'Ficha pessoal')}</p><div class="saved-exercise-list">${workout.exercises.map(x=>`<div><span>${esc(x.name)}</span><small>${Number(x.sets)||3} × ${esc(x.reps||'8–12')} · ${Number(x.rest)||90}s</small><button type="button" class="text-button" data-video-query="${encodeURIComponent(x.name)}">Vídeo</button></div>`).join('')}</div><div class="saved-workout-actions"><button type="button" class="secondary" data-edit-workout="${esc(workout.id)}">Editar</button><button type="button" class="text-button" data-activate-workout="${esc(workout.id)}">Usar hoje</button><button type="button" class="text-button" data-delete-workout="${esc(workout.id)}">Excluir</button></div></article>`).join('')+'</div>':'<p class="empty-state">Você ainda não salvou fichas. Crie uma para organizar seus exercícios e parâmetros.</p>';
  }
  function renderTraining() {
    const training=state.training, workouts=training.workouts;
    $('#completeWorkout').textContent=training.completed?'✓ Treino concluído':'Concluir treino de hoje';
    $('#completeWorkout').classList.toggle('secondary',training.completed); $('#completeWorkout').classList.toggle('primary',!training.completed);
    const active=workouts.find(x=>x.id===training.activeWorkoutId)||workouts[0];
    renderTurbo();
    $('#todayWorkoutDetails').innerHTML=active?`<h3>${esc(active.name)} <span class="badge">${active.exercises.length} exercícios</span></h3><p class="muted">${esc(active.schedule||'Sem dia definido')}</p><div class="exercise-list">${active.exercises.slice(0,5).map(x=>`<div><b>${esc(x.name)}</b><span>${Number(x.sets)||3} × ${esc(x.reps||'8–12')}</span></div>`).join('')}</div>${active.exercises.length>5?'<small class="muted">e mais exercícios na ficha</small>':''}`:'<div class="empty-state"><b>Nenhuma ficha ativa ainda.</b><br>Monte um treino para ver aqui a sessão do dia.</div>';
    renderSavedWorkouts();
    renderExerciseCatalog();
    renderWorkoutDraft();
    const blocks=[['Sem. 1–6','Acumulação I','Volume progressivo · RIR 2–3'],['Sem. 7–12','Acumulação II','Maior estímulo · RIR 1–2'],['Sem. 13–18','Intensificação','Carga em foco · RIR 1–2'],['Sem. 19–24','Consolidação','Volume ajustado · deload estratégico']];
    $('#periodizationTable').innerHTML=blocks.map(b=>`<div class="block"><span class="week">${b[0]}</span><h4>${b[1]}</h4><p>${b[2]}</p></div>`).join('');
    drawVolume();
  }
  function renderRecovery() { const r=state.recovery, score=readiness(), sleep=sleepHours(), bed=timeInBed(), efficiency=Math.round(sleep/bed*100), regular=regularity(); $('#bedtime').value=r.bedtime; $('#wakeTime').value=r.wake; $('#sleepGoalInput').value=r.sleepGoal; $('#awakeMinutes').value=r.awake; $('#sleepQuality').value=r.quality; $('#stress').value=r.stress; $('#water').value=r.water; $('#timeAsleep').textContent=duration(sleep*60); $('#sleepWindow').textContent=`${r.bedtime} → ${r.wake} · ${r.awake} min acordado`; $('#timeInBed').textContent=duration(bed); $('#sleepEfficiency').textContent=`${efficiency}%`; $('#sleepRegularity').textContent=`${regular}%`; $('#sleepGoalProgress').textContent=`${Math.min(100,Math.round(sleep/r.sleepGoal*100))}%`; $('#sleepGoalBadge').textContent=`meta ${decimal(r.sleepGoal)} h`; drawSleepWeek([...r.history.slice(-6),sleep],r.sleepGoal); }
  function renderFocus() { const f=state.focus; $('#screenTime').value=f.screen; $('#deepFocus').value=f.deep; $('#reading').value=f.reading; $('#steps').value=f.steps; $('#screenFeedback').textContent=f.screen<=3?'Seu tempo de tela está dentro da meta. Mantenha um período sem celular antes de dormir.':`Hoje foram ${decimal(f.screen)} h de tela. Experimente deixar o celular fora do quarto e criar um bloco de 30 minutos sem notificações.`; $('#taskList').innerHTML=state.tasks.length?state.tasks.map((task,i)=>`<label class="task-item ${task.done?'done':''}"><input type="checkbox" data-task="${i}" ${task.done?'checked':''}><span>${esc(task.text)}</span></label>`).join(''):'<p class="empty-state">Nenhuma ação planejada para hoje.</p>'; }
  function updateAchievements() {
    const log=state.achievementLog||(state.achievementLog={}), unlocked=state.achievements.unlocked, today=todayKey();
    const t=totals(), foodMet=t.kcal>=state.goals.kcal*.8&&t.protein>=state.goals.protein*.8, trainingMet=Boolean(state.training.completed);
    const changed=JSON.stringify(log[today])!==JSON.stringify({food:foodMet,training:trainingMet}); log[today]={food:foodMet,training:trainingMet};
    const week=weekStartKey(), month=today.slice(0,7), rows=Object.entries(log);
    const weekRows=rows.filter(([date])=>date>=week&&date<=today).map(([,value])=>value), monthRows=rows.filter(([date])=>date.startsWith(month)).map(([,value])=>value);
    const foodWeek=weekRows.filter(x=>x.food).length, trainingWeek=weekRows.filter(x=>x.training).length, foodMonth=monthRows.filter(x=>x.food).length, trainingMonth=monthRows.filter(x=>x.training).length;
    const goals=[['day-food',foodMet,'Hoje'],['day-training',trainingMet,'Hoje'],['week-food',foodWeek>=5,'Semana'],['week-training',trainingWeek>=3,'Semana'],['month-food',foodMonth>=20,'Mês'],['month-training',trainingMonth>=12,'Mês']];
    const justUnlocked=[];
    for(const [key,qualified] of goals){const period=key.startsWith('day-')?today:key.startsWith('week-')?week:month;const id=`${key}-${period}`;if(qualified&&!unlocked[id]){unlocked[id]=new Date().toISOString();justUnlocked.push(id);}}
    const anyChanged=changed||justUnlocked.length>0;
    if(anyChanged)persist(justUnlocked.length?`🔓 Meta desbloqueada! ${justUnlocked.length>1?'Novas conquistas liberadas.':'Sua consistência está aparecendo.'}`:undefined);
    return justUnlocked;
  }
  function renderAchievements(justUnlocked=[]) {
    const today=todayKey(),week=weekStartKey(),month=today.slice(0,7),log=state.achievementLog,unlocked=state.achievements.unlocked;
    const rows=Object.entries(log),weekRows=rows.filter(([date])=>date>=week&&date<=today).map(([,v])=>v),monthRows=rows.filter(([date])=>date.startsWith(month)).map(([,v])=>v);
    const t=totals(),foodProgress=Math.min(t.kcal/state.goals.kcal,t.protein/state.goals.protein)/.8*100;
    const cards=[
      {key:'day-food',period:today,title:'Prato em equilíbrio',detail:'Energia + proteína no alvo',progress:Math.min(100,foodProgress),value:`${Math.round(Math.min(100,foodProgress))}%`,id:`day-food-${today}`},
      {key:'day-training',period:today,title:'Treino do dia',detail:'Conclua sua sessão planejada',progress:state.training.completed?100:0,value:state.training.completed?'1/1':'0/1',id:`day-training-${today}`},
      {key:'week-food',period:week,title:'Ritmo alimentar',detail:'5 dias com metas atingidas',progress:weekRows.filter(x=>x.food).length/5*100,value:`${weekRows.filter(x=>x.food).length}/5 dias`,id:`week-food-${week}`},
      {key:'week-training',period:week,title:'Semana em movimento',detail:'3 sessões concluídas',progress:weekRows.filter(x=>x.training).length/3*100,value:`${weekRows.filter(x=>x.training).length}/3 sessões`,id:`week-training-${week}`},
      {key:'month-food',period:month,title:'Constância à mesa',detail:'20 dias com metas atingidas',progress:monthRows.filter(x=>x.food).length/20*100,value:`${monthRows.filter(x=>x.food).length}/20 dias`,id:`month-food-${month}`},
      {key:'month-training',period:month,title:'Mês de evolução',detail:'12 sessões concluídas',progress:monthRows.filter(x=>x.training).length/12*100,value:`${monthRows.filter(x=>x.training).length}/12 sessões`,id:`month-training-${month}`}
    ];
    const opened=Object.keys(unlocked).length;$('#achievementCount').textContent=`${opened} ${opened===1?'aberta':'abertas'}`;
    $('#goalAchievements').innerHTML=cards.map(card=>{const isOpen=Boolean(unlocked[card.id]);return `<article class="goal-card ${isOpen?'is-unlocked':'is-locked'} ${justUnlocked.includes(card.id)?'just-unlocked':''}"><span class="goal-lock" aria-hidden="true"><span class="closed-lock">🔒</span><span class="open-lock">🔓</span></span><div class="goal-card-copy"><small>${card.key.startsWith('day-')?'DIÁRIA':card.key.startsWith('week-')?'SEMANAL':'MENSAL'} · ${card.key.includes('food')?'COMIDA':'TREINO'}</small><b>${card.title}</b><span>${isOpen?'Conquista liberada':card.detail}</span></div><div class="goal-progress"><i style="--progress:${Math.min(100,card.progress)}%"></i></div><em>${isOpen?'DESBLOQUEADA':card.value}</em></article>`;}).join('');
  }
  function renderAll() { const justUnlocked=updateAchievements(); renderOverview(); renderAchievements(justUnlocked); renderNutrition(); renderTraining(); renderRecovery(); renderFocus(); renderSpotify(); }

  function chartPalette(){const theme=state.preferences.theme;return theme==='red'?{accent:'#ff5368',bright:'#ffc65c',muted:'#ddb3ba',grid:'#572b35',text:'#fff0f1',bar:'#f27c86',goal:'#ffb35f'}:theme==='dark'?{accent:'#ad8aff',bright:'#b8f17c',muted:'#b9b1c5',grid:'#3e3948',text:'#f4effa',bar:'#8ecbe0',goal:'#efaa5e'}:{accent:'#7652d6',bright:'#a6ed72',muted:'#776e84',grid:'#e8e3ef',text:'#211832',bar:'#8bb6da',goal:'#f4a261'};}
  function drawCanvas(id, draw) { const canvas=$(id); if (!canvas) return; const rect=canvas.getBoundingClientRect(), ratio=window.devicePixelRatio||1; canvas.width=Math.max(1,rect.width*ratio); canvas.height=Math.max(1,rect.height*ratio); const ctx=canvas.getContext('2d'); ctx.scale(ratio,ratio); draw(ctx,rect.width,rect.height); }
  function drawConsistency(today) { drawCanvas('#consistencyChart',(ctx,w,h)=>{const vals=[58,72,68,83,64,77,today], labels=['Seg','Ter','Qua','Qui','Sex','Sáb','Hoje'], pad={x:25,y:18,b:28}, chartH=h-pad.y-pad.b, step=(w-pad.x-12)/(vals.length-1); ctx.clearRect(0,0,w,h); for(let i=0;i<4;i++){const y=pad.y+chartH*i/3;ctx.strokeStyle=chartPalette().grid;ctx.beginPath();ctx.moveTo(pad.x,y);ctx.lineTo(w-10,y);ctx.stroke();}const target=pad.y+chartH*(1-.8);ctx.setLineDash([4,4]);ctx.strokeStyle='#f4a261';ctx.beginPath();ctx.moveTo(pad.x,target);ctx.lineTo(w-10,target);ctx.stroke();ctx.setLineDash([]);ctx.strokeStyle=chartPalette().accent;ctx.lineWidth=3;ctx.beginPath();vals.forEach((v,i)=>{const x=pad.x+i*step,y=pad.y+chartH*(1-v/100);i?ctx.lineTo(x,y):ctx.moveTo(x,y)});ctx.stroke();vals.forEach((v,i)=>{const x=pad.x+i*step,y=pad.y+chartH*(1-v/100);ctx.fillStyle=chartPalette().accent;ctx.beginPath();ctx.arc(x,y,3.5,0,7);ctx.fill();ctx.fillStyle=chartPalette().muted;ctx.textAlign='center';ctx.font='10px system-ui';ctx.fillText(labels[i],x,h-8);}); }); }
  function drawMacro(t) { drawCanvas('#macroChart',(ctx,w,h)=>{const parts=[t.protein,t.carbs,t.fat], colors=['#e87987','#f4a261','#76b6d7'], labels=['Proteína','Carboidratos','Gorduras'], total=Math.max(1,parts.reduce((a,b)=>a+b,0)), cx=w/2,cy=h/2-5,rad=Math.min(w,h)*.27;ctx.clearRect(0,0,w,h);let start=-Math.PI/2;parts.forEach((part,i)=>{const end=start+(part/total)*Math.PI*2;ctx.beginPath();ctx.strokeStyle=colors[i];ctx.lineWidth=22;ctx.arc(cx,cy,rad,start,end);ctx.stroke();start=end;});ctx.fillStyle=chartPalette().text;ctx.textAlign='center';ctx.font='800 22px system-ui';ctx.fillText(`${number(t.kcal)}`,cx,cy+3);ctx.fillStyle=chartPalette().muted;ctx.font='10px system-ui';ctx.fillText('kcal registradas',cx,cy+20); $('#macroLegend').innerHTML=parts.map((part,i)=>`<span style="border-left:3px solid ${colors[i]};padding-left:6px"><b>${decimal(part)} g</b>${labels[i]}</span>`).join('');}); }
  function drawVolume() { drawCanvas('#volumeChart',(ctx,w,h)=>{const vals=[52,58,64,68,62,71,76,80], labels=['S1','S3','S6','S8','S12','S16','S20','S24'], pad=24, max=85,barW=(w-pad*2)/vals.length*.56;ctx.clearRect(0,0,w,h);vals.forEach((v,i)=>{const x=pad+i*((w-pad*2)/vals.length)+(w-pad*2)/vals.length/2-barW/2, bh=(h-36)*(v/max),y=h-22-bh;ctx.fillStyle=i===vals.length-1?chartPalette().bright:chartPalette().accent;ctx.fillRect(x,y,barW,bh);ctx.fillStyle=chartPalette().muted;ctx.font='10px system-ui';ctx.textAlign='center';ctx.fillText(labels[i],x+barW/2,h-7);}); }); }
  function drawSleepWeek(values, goal) { drawCanvas('#sleepWeekChart',(ctx,w,h)=>{const labels=['Seg','Ter','Qua','Qui','Sex','Sáb','Hoje'], pad={l:25,r:10,t:18,b:28}, max=10, chartH=h-pad.t-pad.b, step=(w-pad.l-pad.r)/values.length, barW=Math.min(28,step*.55);ctx.clearRect(0,0,w,h);for(let i=0;i<4;i++){const y=pad.t+chartH*i/3;ctx.strokeStyle=chartPalette().grid;ctx.beginPath();ctx.moveTo(pad.l,y);ctx.lineTo(w-pad.r,y);ctx.stroke();}const gy=pad.t+chartH*(1-goal/max);ctx.setLineDash([4,4]);ctx.strokeStyle=chartPalette().goal;ctx.beginPath();ctx.moveTo(pad.l,gy);ctx.lineTo(w-pad.r,gy);ctx.stroke();ctx.setLineDash([]);values.forEach((v,i)=>{const x=pad.l+step*i+(step-barW)/2, bh=chartH*Math.min(v/max,1), y=pad.t+chartH-bh;ctx.fillStyle=i===values.length-1?chartPalette().accent:chartPalette().bar;ctx.beginPath();ctx.roundRect(x,y,barW,bh,5);ctx.fill();ctx.fillStyle=chartPalette().muted;ctx.font='10px system-ui';ctx.textAlign='center';ctx.fillText(labels[i],x+barW/2,h-8);});}); }
  function renderFoodPreview() { const food=foods[Number($('#foodInput').value)||0], grams=Math.max(1,Number($('#gramsInput').value)||0), scale=grams/100; $('#foodPreview').innerHTML=`<b>${food.name} · ${grams} g</b><br>${number(food.kcal*scale)} kcal · ${decimal(food.p*scale)} g proteína · ${decimal(food.c*scale)} g carboidratos · ${decimal(food.f*scale)} g gorduras`; }
  function showMeal(meal) { $('#mealInput').value=meal||'Café da manhã'; $('#mealDialog').showModal(); renderFoodPreview(); }
  function activateView(id) { $$('.nav-link').forEach(btn=>btn.classList.toggle('active',btn.dataset.view===id)); $$('.view').forEach(view=>view.classList.toggle('active',view.id===id)); const names={overview:'Visão geral',nutrition:'Nutrição',training:'Treino & periodização',recovery:'Recuperação',focus:'Foco & rotina'}; $('#pageTitle').textContent=names[id]; if(id==='overview') drawConsistency(dayScore()); if(id==='nutrition') drawMacro(totals()); if(id==='training') drawVolume(); if(id==='recovery') renderRecovery(); window.scrollTo({top:0,behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'}); }

  $$('.nav-link').forEach(button=>button.addEventListener('click',()=>activateView(button.dataset.view)));
  $('[data-jump="nutrition"]').addEventListener('click',()=>activateView('nutrition'));
  $('#quickMeal').addEventListener('click',()=>showMeal()); $('#openMealForm').addEventListener('click',()=>showMeal());
  $('#foodInput').addEventListener('change',renderFoodPreview); $('#gramsInput').addEventListener('input',renderFoodPreview);
  $('#saveFood').addEventListener('click',()=>{const food=foods[Number($('#foodInput').value)||0], grams=Math.max(1,Number($('#gramsInput').value)||0), s=grams/100; state.food.push({date:todayKey(),name:food.name,grams:Math.round(grams),meal:$('#mealInput').value,kcal:food.kcal*s,p:food.p*s,c:food.c*s,f:food.f*s}); $('#mealDialog').close(); persist('Refeição registrada. O resumo do dia foi atualizado.'); renderAll();});
  document.addEventListener('click',event=>{const add=event.target.dataset.addMeal, remove=event.target.dataset.deleteFood, supp=event.target.dataset.supplement; if(add!==undefined) showMeal(add); if(remove!==undefined){state.food.splice(Number(remove),1);persist('Item removido do diário.');renderAll();} if(supp){state.supplements[supp]=!state.supplements[supp];persist(state.supplements[supp]?`${supp} registrado.`:`${supp} removido do registro.`);renderNutrition();}});
  $('#applyProteinGoal').addEventListener('click',()=>{state.profile.weight=Math.max(30,Number($('#bodyWeight').value)||75); state.profile.proteinFactor=Math.max(1.2,Number($('#proteinFactor').value)||1.8);state.goals.protein=Math.round(state.profile.weight*state.profile.proteinFactor);persist(`Meta de proteína ajustada para ${state.goals.protein} g.`);renderAll();});
  $('#completeWorkout').addEventListener('click',()=>{state.training.currentDay=todayKey();state.training.completed=!state.training.completed;persist(state.training.completed?'Treino concluído. Boa sessão!':'Treino marcado como pendente.');renderAll();});
  const showNewWorkout=()=>openWorkoutBuilder();
  $('#newWorkoutButton').addEventListener('click',showNewWorkout);
  $('#newWorkoutSecondary').addEventListener('click',showNewWorkout);
  $('#closeTrainingBuilder').addEventListener('click',()=>$('#trainingBuilder').classList.add('hidden'));
  $('#cancelWorkoutEdit').addEventListener('click',()=>$('#trainingBuilder').classList.add('hidden'));
  $('#exerciseSearch').addEventListener('input',renderExerciseCatalog);
  $('#exerciseMuscleFilter').addEventListener('change',renderExerciseCatalog);
  $('#saveWorkoutButton').addEventListener('click',()=>{
    const name=$('#workoutName').value.trim();
    if(!name){$('#workoutName').focus();notify('Dê um nome para a ficha antes de salvar.');return;}
    if(!draftExercises.length){notify('Adicione pelo menos um exercício à ficha.');return;}
    const workout={id:editingWorkoutId||makeId('workout'),name,schedule:$('#workoutSchedule').value.trim(),notes:$('#workoutNotes').value.trim(),exercises:draftExercises.map(x=>({...x}))};
    const index=state.training.workouts.findIndex(x=>x.id===workout.id);
    if(index>=0)state.training.workouts[index]=workout;else state.training.workouts.push(workout);
    if(!state.training.activeWorkoutId)state.training.activeWorkoutId=workout.id;
    $('#trainingBuilder').classList.add('hidden');draftExercises=[];editingWorkoutId=null;
    persist('Ficha salva neste dispositivo e sincronizada quando houver conexão.');renderAll();
  });
  document.addEventListener('input',event=>{
    const {draftId, draftField}=event.target.dataset;
    if(!draftId||!draftField)return;
    const item=draftExercises.find(x=>x.id===draftId);if(!item)return;
    item[draftField]=['sets','load','rest'].includes(draftField)?event.target.value:event.target.value;
  });
  document.addEventListener('click',event=>{
    const add=event.target.closest('[data-add-exercise]')?.dataset.addExercise;
    const remove=event.target.closest('[data-remove-exercise]')?.dataset.removeExercise;
    const edit=event.target.closest('[data-edit-workout]')?.dataset.editWorkout;
    const activate=event.target.closest('[data-activate-workout]')?.dataset.activateWorkout;
    const removeWorkout=event.target.closest('[data-delete-workout]')?.dataset.deleteWorkout;
    const video=event.target.closest('[data-video-query]')?.dataset.videoQuery;
    if(add){const exercise=exerciseCatalog.find(x=>x.id===add);if(exercise){draftExercises.push({...exercise,id:makeId('exercise'),sets:3,reps:'8–12',load:'',rest:90});renderWorkoutDraft();}}
    if(remove){draftExercises=draftExercises.filter(x=>x.id!==remove);renderWorkoutDraft();}
    if(edit){const workout=state.training.workouts.find(x=>x.id===edit);if(workout)openWorkoutBuilder(workout);}
    if(activate){state.training.activeWorkoutId=activate;state.training.completed=false;persist('Treino definido para hoje.');renderAll();}
    if(removeWorkout&&window.confirm('Excluir esta ficha salva?')){state.training.workouts=state.training.workouts.filter(x=>x.id!==removeWorkout);if(state.training.activeWorkoutId===removeWorkout)state.training.activeWorkoutId=state.training.workouts[0]?.id||null;persist('Ficha excluída.');renderAll();}
    if(video){const term=decodeURIComponent(video);window.open('https://www.youtube.com/results?search_query='+encodeURIComponent(term+' execução exercício português'),'_blank','noopener,noreferrer');}
  });
  $('#saveRecovery').addEventListener('click',()=>{const prior=state.recovery.history||[];state.recovery={bedtime:$('#bedtime').value||'23:00',wake:$('#wakeTime').value||'07:00',sleepGoal:Number($('#sleepGoalInput').value)||8,awake:Number($('#awakeMinutes').value)||0,quality:Number($('#sleepQuality').value)||0,stress:Number($('#stress').value)||0,water:Number($('#water').value)||0,history:prior};persist('Sono salvo. Duração, eficiência e regularidade foram atualizadas.');renderAll();});
  $('#saveFocus').addEventListener('click',()=>{state.focus={screen:Number($('#screenTime').value)||0,deep:Number($('#deepFocus').value)||0,reading:Number($('#reading').value)||0,steps:Number($('#steps').value)||0};persist('Rotina atualizada.');renderAll();});
  $('#taskForm').addEventListener('submit',event=>{event.preventDefault();const input=$('#taskInput'),text=input.value.trim();if(!text)return;state.tasks.push({text,done:false});input.value='';persist('Ação adicionada à lista.');renderFocus();});
  document.addEventListener('change',event=>{const task=event.target.dataset.task;if(task!==undefined){state.tasks[Number(task)].done=event.target.checked;persist(event.target.checked?'Concluído. Bom trabalho!':'Tarefa reaberta.');renderFocus();}});
  $$('[data-theme-choice]').forEach(button=>button.addEventListener('click',()=>setTheme(button.dataset.themeChoice)));
  $('#saveSpotifyPlaylist').addEventListener('click',()=>{const value=$('#spotifyPlaylistUrl').value.trim(),src=spotifyEmbed(value);if(!src){$('#spotifyFeedback').textContent='Cole um link válido do Spotify no formato open.spotify.com/playlist/…';return;}state.spotifyPlaylists[state.preferences.theme]=value;persist(`Playlist salva para o modo ${themeName()}.`);renderSpotify();});
  $('#clearSpotifyPlaylist').addEventListener('click',()=>{state.spotifyPlaylists[state.preferences.theme]='';persist(`Playlist removida do modo ${themeName()}.`);renderSpotify();});
  $('#openTurboButton').addEventListener('click',()=>{const t=state.training.turbo;t.active=true;if(t.remaining<=0)t.remaining=2700;renderTurbo();persist('Modo turbo preparado. Inicie o sprint quando estiver pronto.');$('#turboPanel').scrollIntoView({behavior:'smooth',block:'center'});});
  $('#turboAction').addEventListener('click',()=>{const t=state.training.turbo;if(t.running){t.remaining=Math.max(0,Math.ceil((t.endsAt-Date.now())/1000));t.running=false;t.endsAt=null;persist('Sprint pausado.');}else{if(t.remaining<=0)t.remaining=2700;t.active=true;t.running=true;t.endsAt=Date.now()+t.remaining*1000;persist('Sprint turbo iniciado por 45 minutos.');}renderTurbo();});
  $('#turboReset').addEventListener('click',()=>{state.training.turbo={active:false,running:false,remaining:2700,endsAt:null};renderTurbo();persist('Modo turbo encerrado.');});
  setInterval(()=>{const t=state.training.turbo;if(!t.running)return;t.remaining=Math.max(0,Math.ceil((t.endsAt-Date.now())/1000));$('#turboCountdown').textContent=formatClock(t.remaining);if(t.remaining===0){t.running=false;t.endsAt=null;renderTurbo();persist('Sprint concluído. Respire e registre como foi.');}},1000);
  $('#loginButton').addEventListener('click',async()=>{if(!window.fitpulseFirebase){$('#authMessage').textContent='A conexão com o Firebase ainda está iniciando. Tente novamente em alguns segundos.';return;}try{$('#authMessage').textContent='Abrindo o login seguro do Google…';await window.fitpulseFirebase.signIn();}catch(error){$('#authMessage').textContent='Não foi possível iniciar o login. Confira o provedor Google e o domínio autorizado no Firebase.';}});
  $('#signOutButton').addEventListener('click',async()=>{try{await window.fitpulseFirebase?.signOut?.();}catch{notify('Não foi possível sair agora.');}});
  window.addEventListener('fitpulse:firebase-ready',()=>{if(!window.fitpulseFirebase) $('#authMessage').textContent='Firebase não foi carregado. Confira o arquivo firebase-config.js.';});
  window.addEventListener('fitpulse:auth-changed',async event=>{activeUser=event.detail||null;if(!activeUser){$('#authGate').classList.remove('hidden');$('#appShell').classList.add('hidden');$('#authMessage').textContent=window.fitpulseFirebase?'Use sua conta para manter seus dados privados e sincronizados.':'Firebase não foi carregado. Confira o arquivo firebase-config.js.';return;} $('#authGate').classList.add('hidden');$('#appShell').classList.remove('hidden');const name=activeUser.displayName||'Atleta';$('#profileSummary').innerHTML=`<span class="avatar">${esc(name.split(' ').map(x=>x[0]).slice(0,2).join(''))}</span><div><b>${esc(name.split(' ')[0])}</b><small>conta sincronizada</small></div>`;try{const remote=await window.fitpulseFirebase.load();if(remote){state=hydrate(remote);localStorage.setItem('fitpulse-v2',JSON.stringify(state));}else{persist();}}catch{notify('Usando a versão salva neste dispositivo.');}renderAll();});
  $('#dateLabel').textContent=new Intl.DateTimeFormat('pt-BR',{weekday:'long',day:'numeric',month:'long'}).format(new Date()).toUpperCase();
  setTheme(state.preferences.theme,false); renderAll(); window.addEventListener('resize',()=>{drawConsistency(dayScore());drawMacro(totals());drawVolume();});
})();

