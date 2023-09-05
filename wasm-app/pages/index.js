import { useState } from 'react';

let setRoot, getPptx, setConfig;

if (typeof window !== 'undefined') {
  ({ setRoot, getPptx, setConfig } = ppt2video);
  const {origin} = location;
  setConfig('pollyProxy', origin + '/app/polly');
  setConfig('ffmpegDir', origin + '/ffmpeg');
}

let dirHandle = null;
let pptx = null;

async function openDirectory() {
  dirHandle = await window.showDirectoryPicker();
  setRoot(dirHandle);
}

async function getPptxList() {
  const ret = [];
  const re = /.(pptx|PPTX)/;
  for await (const dirent of dirHandle.entries()) {
    const match = dirent[0].match(re);
    if (match) {
      ret.push(dirent[0]);
    }
  }
  return ret;
}

async function openPptx(filename) {
  pptx = await getPptx(filename);
  await pptx.init();
  pptx.zipControl('start');
}

async function processImportJson(topicCheckList) {
  const option = {
    importJsonOnly: true,
    topicCheckList,
  };
  await pptx.process(option);
}

const states = {
  init: 1,
  running: 2,
  success: 3,
  error: 4,
};

let topicList = null;
let runningCount = 0;
const runningChars = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];

function getTopicList() {
  const list = [];
  for (const section of pptx.sections) {
    list.push({
      name: section.topics[0].name,
      state: states.init,
    });
  }
  topicList = list;
  return curTopicState();
}

function topicState(i, state) {
  if (i < 0) {
    for (const e of topicList) {
      if (e.state === states.running) {
        e.state = states.error;
      }
    }
  } else {
    topicList[i].state = state;
  }
}

function curTopicState() {
  const ret = topicList.map((topic, index) => {
    let pre;
    switch(topic.state) {
      case states.init:    pre = '';break;
      case states.running: pre = runningChars[runningCount] + ' ';break;
      case states.success: pre = '✓ ';break;
      case states.error:   pre = 'エラー!! ';break;
    }
    return pre + topic.name;
  });
  runningCount++;
  if (runningCount >= runningChars.length) {
    runningCount = 0;
  }
  return ret;
}

async function processTopic(num, fps, bitrate) {
  const targetTopic = pptx.sections[num].topics[0];
  const option = {
    videoOnly: true,
    targetTopic,
    fps,
    bitrate,
  };
  await pptx.process(option);
}

async function flushZip() {
  await pptx.zipControl('flush');
}

const steps = {
  step1: 1,
  step2: 2,
  step3: 3,
  step35: 4,
  step4: 5,
};

function Message(props) {
  if (props.msg) {
    return (
      <div>
        <br/>
        <textarea readOnly="readonly" rows="5" cols="80" defaultValue={props.msg}></textarea>
      </div>
    );
  }
  return null;
}

const FPSList = [5, 10, 12.5, 15, 25, 30];
const FPSDefault = 12.5;
const bitrateList = [250000, 500000, 750000];
const bitrateDefault = 250000;

function OptionSelector({label, list, defaultValue, handler}) {
  return (
    <label>
      {label}:
      <select value={defaultValue} onChange={handler}>
        {list.map((v, index) => (
          <option value={v} key={index}>{v}</option>
        ))}
      </select>
    </label>
  );
}

function getVoiceList() {
  const list = [];
  for (const section of pptx.sections) {
    const voiceList = [];
    for (const topic of section.topics) {
      for (const slide of topic.slides) {
        if (slide.voice) {
          voiceList.push(slide.voice);
        }
      }
    }
    list.push(voiceList);
  }
  return list;
}

function getKeywordList() {
  const list = [];
  for (const section of pptx.importJson.sections) {
    const keywords = section.topics[0].keywords;
    list.push(keywords ? keywords.join() : "");
  }
  return list;
}

function App() {
  const [step, setStep] = useState(steps.step1);
  const [pptxList, setPptxList] = useState([]);
  const [topicList, setTopicList] = useState([]);
  const [topicCheckList, setTopicCheckList] = useState([]);
  const [filename, setFilename] = useState(null);
  const [error1, setError1] = useState(null);
  const [error2, setError2] = useState(null);
  const [error3, setError3] = useState(null);
  const [error4, setError4] = useState(null);
  const [FPS, setFPS] = useState(FPSDefault);
  const [bitrate, setBitrate] = useState(bitrateDefault);
  const [voiceList, setVoiceList] = useState([]);
  const [keywordList, setKeywordList] = useState([]);

  async function handleStep1OpenDirectory() {
    try {
      setError1(null);
      await openDirectory();
      readDirectory();
    } catch(e) {
      setError1('ディレクトリを開くことができませんでした。\n' + e.message);
    }
  }

  async function readDirectory() {
    const list = await getPptxList();
    setPptxList(list);
    setStep(steps.step2);
  }

  function handleFilename(e) {
    setFilename(e.target.value);
  }

  async function readPptx() {
    await openPptx(filename);
    const list = await getTopicList();
    setTopicList(list);
    const checkList = new Array(list.length).fill(true);
    setTopicCheckList(checkList);
    setVoiceList(getVoiceList());
    setKeywordList(getKeywordList());
  }

  async function handleStep2Next() {
    try {
      setError2(null);
      await readPptx();
      setStep(steps.step3);
    } catch(e) {
      setError2(e.toString());
    }
  }

  async function handleStep2Reload() {
    setError2(null);
    readDirectory();
  }

  function handleChange(e) {
    const list = [...topicCheckList];
    list[e.target.id] = e.target.checked;
    setTopicCheckList(list);
  }

  function updateTopicList() {
    const list = curTopicState();
    setTopicList(list);
  }

  function timerFunction() {
    updateTopicList();
  }

  function finalTopicList(timerId) {
    clearInterval(timerId);
    topicState(-1, null);
    updateTopicList();
  }

  async function handleStep3Start() {
    if (error3 !== null) {
      try {
        await readPptx();
      } catch(e){
        setError3(e.message);
        return;
      }
    }

    const numTopics = getTopicList().length;
    let timerId;

    try {
      setError3(null);
      setStep(steps.step35);
      timerId = setInterval(timerFunction, 100);
      for (let i = 0; i < numTopics; i++) {
        if (topicCheckList[i]) {
          topicState(i, states.running);
          await processTopic(i, FPS, bitrate);
          topicState(i, states.success);
        }          
      }
      finalTopicList(timerId);
      await processImportJson(topicCheckList);
      setStep(steps.step4);
    } catch(e){
      finalTopicList(timerId);
      setError3(e.message);
      setStep(steps.step3);
    }
  }

  function setTopicCheckListAll(flag) {
    const checkList = new Array(topicCheckList.length).fill(flag);
    setTopicCheckList(checkList);
  }

  function handleStep3SelectAll() {
    setTopicCheckListAll(true);
  }

  function handleStep3Clear() {
    setTopicCheckListAll(false);
  }

  async function handleStep4Save() {
    try {
      setError4(null);
      await flushZip();
      setPptxList([]);
      setFilename(null);
      setTopicList([]);
      readDirectory();
    } catch(e){
      setError4('zipファイルの保存に失敗しました。\n' + e.message);
    }
  }

  function FPSHandler(e) {
    setFPS(Number(e.target.value));
  }

  function bitrateHandler(e) {
    setBitrate(Number(e.target.value));
  }

  return (
    <div>
      <h2> step1: パワーポイントファイルを含むディレクトリを選択します。</h2>
      <button onClick={handleStep1OpenDirectory} disabled={step !== steps.step1}>ディレクトリを選択する</button>
      <div style={{ display: step === steps.step1 ? 'none' : '' }}>
        <br/>
        別のディレクトリを選択したいときはページをリロードしてください。
        <br/>
      </div>
      <Message msg={error1} />
      <h2> step2: パワーポイントファイルを選択して開きます。</h2>
      <form>
        {pptxList.map((filename, index) =>
          <div key={index}>
            <input type="radio" name="pptx" value={filename} onClick={handleFilename} /> {filename}
          </div>
        )}
      </form>
      <br/>
      <button onClick={handleStep2Next} disabled={step === steps.step1 || step === steps.step35 || filename === null}>パワーポイントファイルを開く</button>
      &emsp;
      <button onClick={handleStep2Reload} disabled={step === steps.step1 || step === steps.step35}>ディレクトリの再読込み</button>
      <Message msg={error2} />
      <h2> step3: CHiBi-CHiLO登録データ(zip形式)を作成します。</h2>
      {step === steps.step3 && <table>
        <thead>
          <tr>
            <th></th>
            <th>トピック</th>
            <th>話者</th>
            <th>キーワード</th>
          </tr>
        </thead>
        <tbody>
          {topicList.map((topicname, index) =>
          <tr key={index}>
            <td>
              <input type="checkbox" id={index} checked={topicCheckList[index]} onChange={handleChange} />
            </td>
            <td>{topicname}</td>
            <td>{voiceList[index]}</td>
            <td>{keywordList[index]}</td>
          </tr>
        )}
        </tbody>
      </table>
      }
      <br/>
      <button onClick={handleStep3Start} disabled={step !== steps.step3 || !topicCheckList.some((e) => e)}>データを作成する</button>
      &emsp;
      <button onClick={handleStep3SelectAll} disabled={step !== steps.step3}>全選択</button>
      &emsp;
      <button onClick={handleStep3Clear} disabled={step !== steps.step3}>クリア</button>
      <Message msg={error3} />
      <br/>
      <br/>
      <OptionSelector
        label={"フレームレート(FPS)"}
        list={FPSList}
        defaultValue={FPS}
        handler={FPSHandler}
      />
      &emsp;
      <OptionSelector
        label={"ビットレート(bps)"}
        list={bitrateList}
        defaultValue={bitrate}
        handler={bitrateHandler}
      />
      <h2> step4: CHiBi-CHiLO登録データ(zip形式)を保存します。</h2>
      <button onClick={handleStep4Save} disabled={step !== steps.step4}>データを保存する</button>
      <Message msg={error4} />
    </div>
  )
}

export default App;
