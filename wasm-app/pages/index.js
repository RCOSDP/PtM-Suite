import { useState } from 'react'

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
  step15: 2,
  step2: 3,
  step3: 4,
  step35: 5,
  step4: 6,
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

function OptionSelector({label, list, defaultValue, handler,  className }) {
  return (
    <label>
      {label}
      <select value={defaultValue} onChange={handler} className={className}>
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

function getImportJsonList() {
  const list = [];
  for (const section of pptx.importJson.sections) {
    const {keywords, license} = section.topics[0];
    list.push({
      keywords: keywords ? keywords.join() : "",
      license,
    });
  }
  return list;
}

async function processAuthorized() {
  return await pptx.process({authorized: true});
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
  const [importJsonList, setImportJsonList] = useState([]);

  function chengeStep(e) {
    let stepList = document.querySelectorAll(".step li");
    stepList.forEach((step) => {
      step.classList.remove("is-current");
    });
    stepList[e].classList.add("is-current");

    let stepAreaList = document.querySelectorAll(`[id^='__step']`);
    stepAreaList.forEach((step) => {
      step.classList.add("is-hide");
    });
    stepAreaList[e].classList.remove("is-hide");
  }

  function handleStep0Next() {
    chengeStep(1);
  }

  function handleStep1Back() {
    chengeStep(0);
  }

  function handleStep2Back() {
    chengeStep(1);
  }

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
    setTopicList([]);
    setTopicCheckList([]);
    setVoiceList([]);
    setImportJsonList([]);
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
    setImportJsonList(getImportJsonList());
  }

  async function handleStep2Next() {
    setStep(steps.step15);
    try {
      setError2(null);
      await readPptx();
      setStep(steps.step3);
      chengeStep(2);
    } catch(e) {
      setError2(e.toString());
      setStep(steps.step3);
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

    const authorized = await processAuthorized();
    if (authorized !== "noauthorize" && authorized !== "authorized") {
      setError3("認証がタイムアウトしました。ページをリロードして再試行してください。");
      return;
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
    <div id="__next">
      <h2 className="header" >音声合成ビデオ作成システム
      </h2>
      <div className="help">
        <a target="_blank" href="https://nii-rcos.gitbook.io/tts-mc-help/">
          <button className="popup-button" id="myButton">？
          </button>
        <div className="popup" id="myPopup">詳細なマニュアルを表示します．
        </div>
        </a>
      </div>
      <div className="step-arrow">
        <ul className="step">
          <li className="is-current">STEP0：作成の流れ</li>
          <li>STEP1：PPTの選択</li>
          <li>STEP2：ビデオの作成</li>
        </ul>
      </div>
      <div  id="__step0" className="contents" >	
        <h2 className="step-title">STEP0：音声合成ビデオ作成の流れ</h2>
        <p class="text note">※ FirefoxとSafariでは使用できませんのでご注意ください。<br/>Google Chrome・Microsoft Edgeのみ使用できます。
        </p>
        <hr className="hr" />
        <div className="container">
          <div className="column">
            <span className="step-part">STEP1</span>
          </div>
          <div className="column">
            <div className="note">
              パワーポイントファイルを含むディレクトリを選択し、使用するパワーポイントを選択します。
            </div>
          </div>
        </div>
        <hr className="hr" />
        <div className="container">
          <div className="column">
            <span className="step-part">STEP2</span>
          </div>
          <div className="column">
            <div className="note">
              音声合成ビデオを作成します。
            </div>
          </div>
        </div>
        <hr className="hr" />
        <div>
          <button className="move centered" onClick={handleStep0Next} >STEP1：PPTの選択へ</button>
        </div>
      </div>
      <div  id="__step1" className="contents is-hide" >
        <h2 className="step-title">STEP1：使用するパワーポイントファイルを選択する</h2>
        <div className="text" style={{ display: step === steps.step1 ? 'none' : '' }}>
          別のディレクトリを選択したいときはページをリロードしてください。
        </div>
        <div className="text">
          <Message msg={error1} />
        </div>
        <div>
          <button className="decide centered" onClick={handleStep1OpenDirectory} disabled={step !== steps.step1}>ディレクトリを選択する</button>
        </div>
        <div className="info" style={{ display: step === steps.step1 ? 'none' : '' }}>
          パワーポイントを選択する
        </div>
        <form className="form">
          {pptxList.map((filename, index) =>
            <div key={index}>
              <label><input className="radio" type="radio" name="pptx" value={filename} onClick={handleFilename} /> {filename}
              </label>
            </div>
          )}
        </form>
        <div className="text loading" style={{ display: step === steps.step15 ? '' : 'none' }}>
          <div>読み込み中<span></span></div>
        </div>
        <hr className="hr" />
        <div className="text">
          <button className="decide transition" onClick={handleStep1Back} >STEP0に戻る</button>
          <button className="move transition" onClick={handleStep2Next} disabled={step === steps.step1 || step === steps.step35 || filename === null}>STEP2：ビデオの作成へ</button>
          <Message msg={error2} />
        </div>
      </div>
      <div  id="__step2" className="contents is-hide" >
        <h2 className="step-title"> STEP2：音声合成ビデオを作成する</h2>
          <div className="info">
            スライドを選択する
          </div>
          <div className="form">
            <div className="radio">
              <button className="choice" onClick={handleStep3SelectAll} disabled={step !== steps.step3}>全選択</button>&emsp;
              <button className="choice" onClick={handleStep3Clear} disabled={step !== steps.step3}>全解除</button>
            </div>
            <div className="radio">
              {topicList.length > 0 && 
              <table>
                <tbody>
                  {topicList.map((topicname, index) =>
                    <tr key={index}>
                      <td>
                        <div class="tooltip" key={index}>
                          <p><label><input type="checkbox" id={index} checked={topicCheckList[index]} onChange={handleChange} /> {topicname}</label></p>
                          <div class="description">話者：{voiceList[index]}<br/>ライセンス：{importJsonList[index].license}<br/>キーワード：{importJsonList[index].keywords} </div>
                          </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
              }
            </div>
          </div>
        <div className="info">
          品質を選択する
        </div>
        <div className="selector">
          <OptionSelector 
            list={FPSList}
            defaultValue={FPS}
            handler={FPSHandler}
            className="custom-selector"
          /> FPS
        </div>
        <div className="selector">
          <OptionSelector
            list={bitrateList}
            defaultValue={bitrate}
            handler={bitrateHandler}
            className="custom-selector"
          /> bps
        </div>
        <div className="text">
          <button className="decide output" onClick={handleStep3Start} disabled={step !== steps.step3 || !topicCheckList.some((e) => e)}>ビデオを出力する</button>
          <Message msg={error3} />
        </div>
        <div className="text" style={{ display: step === steps.step4 ? '' : 'none' }}>
          ビデオが出力できました
        </div>
        <div className="text">
          <button className="decide output" onClick={handleStep4Save} disabled={step !== steps.step4}>ビデオを保存する</button>
          <Message msg={error4} />
        </div>
        <div className="text" style={{ display: step === steps.step2 ? '' : 'none' }}>
          ビデオを保存しました
        </div>
        <hr className="hr" />
        <div className="text">
          <button className="decide transition" onClick={handleStep2Back} >STEP1に戻る</button>
        </div>
      </div>
    </div>
  )
}
export default App;
