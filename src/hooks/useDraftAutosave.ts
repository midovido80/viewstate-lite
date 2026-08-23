import {useEffect,useRef} from 'react';
import {AppState} from 'react-native';

export function useDraftAutosave<T>({enabled,key,value,save,delay=900}:{
  enabled:boolean;key:string;value:T;save:(key:string,value:T)=>Promise<void>;delay?:number;
}){
  const latest=useRef(value);const timer=useRef<ReturnType<typeof setTimeout>|null>(null);const generation=useRef(0);const stopped=useRef(false);const chain=useRef<Promise<void>>(Promise.resolve());
  latest.current=value;
  const clearTimer=()=>{if(timer.current){clearTimeout(timer.current);timer.current=null}};
  const enqueue=(expectedGeneration=generation.current)=>{if(!enabled||stopped.current||expectedGeneration!==generation.current)return chain.current;
    const snapshot=latest.current;chain.current=chain.current.catch(()=>{}).then(async()=>{if(expectedGeneration===generation.current)await save(key,snapshot)});return chain.current};
  const flush=()=>{clearTimer();return enqueue()};
  const cancel=()=>{stopped.current=true;generation.current++;clearTimer();return chain.current.catch(()=>{})};

  useEffect(()=>{if(!enabled||stopped.current)return;clearTimer();const expected=generation.current;timer.current=setTimeout(()=>{timer.current=null;void enqueue(expected)},delay);return clearTimer},[delay,enabled,key,value]);
  useEffect(()=>{if(!enabled)return;const subscription=AppState.addEventListener('change',state=>{if(state!=='active'&&!stopped.current)void flush()});return()=>{subscription.remove();if(!stopped.current)void flush()}},[enabled,key]);
  return {flush,cancel};
}
