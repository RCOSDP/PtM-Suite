import { readFileSync } from 'node:fs'
import process from 'node:process'

let in_range;
let files;

//
// 集計
//

const id2user = {};
const org_dict = {};
const eppn_dict = {};
const error_array = ['error', 0, 0, 0, 0, 0, 0, 0, 0];

function type2index(type) {
  switch (type) {
  case 'open-directory': return 1;
  case 'open-pptx':      return 2;
  case 'output-video':   return 3;
  case 'save-video':     return 4;
  }
  return -1;
}

function add_log(dict, key, type) {
  const ar = dict[key];
  const index = type2index(type);
  if (index > 0) ar[index] += 1;
}

function add_log_error(type) {
  const index = type2index(type);
  if (index > 0) error_array[index] += 1;
}

function add_polly(dict, key, num, chars) {
  const ar = dict[key];
  ar[5] += num;
  ar[6] += chars;
}

function add_user(dict, key, user) {
  const ar = dict[key];
  ar[7] += user;
}

function add_login(dict, key, login) {
  const ar = dict[key];
  ar[8] += login;
}

function add_error(polly, login) {
  error_array[5] += polly;
  error_array[8] += login;
}

//
// 行毎の処理
//

function process_login(words) {
  // ユーザを登録、統計情報を初期化する
  const id = words[6];
  const eppn = words[7];
  const [ user, org ] = eppn.split('@');

  if (user && org) {
    id2user[id] = { eppn, org };
    if (!org_dict[org]) {
      org_dict[org] = [org, 0, 0, 0, 0, 0, 0, 0, 0];
    }
    if (!eppn_dict[eppn]) {
      eppn_dict[eppn] = [eppn, 0, 0, 0, 0, 0, 0, 0, 0];
    }
    if (in_range(words)) add_login(org_dict, org, 1);
  }
}

function process_polly(words) {
  const id = words[6];
  const chars = parseInt(words[7]);

  // 文字数 0 は認証チェックのアクセスのため、実行回数にカウントしない
  if (chars == 0) return;

  const user = id2user[id];
  if (!user) return;
  const { eppn, org } = user;
  if (eppn) add_polly(eppn_dict, eppn, 1, chars);
  if (org)  add_polly(org_dict,  org,  1, chars);
}

function process_log(words) {
  const id = words[6];
  const type = words[7];

  if (type === 'error') {
    return add_log_error(words[8]);
  }

  const user = id2user[id];
  if (!user) return;
  const { eppn, org } = user;
  if (eppn) add_log(eppn_dict, eppn, type);
  if (org)  add_log(org_dict,  org,  type);
}

function process_http_error(words) {
  const path =   words[4];

  switch (path) {
  case '/login':
    add_error(0, 1);
    break;
  case '/app/polly':
    add_error(1, 0);
    break;
  }
}

function process_line(words) {
  const method = words[3];
  const path =   words[4];
  const status = words[5];

  // GET など POST 以外のログは処理しない
  if (method !== 'POST') return;

  if (status !== '200') {
    // HTTP エラーの処理
    if (in_range(words)) process_http_error(words);
    return;
  }

  if (!in_range(words)) {
    // 集計範囲外でも /login は処理する
    if(path === '/login') process_login(words);
    return;
  }

  // パス毎の処理に分岐する
  switch (path) {
  case '/login':
    process_login(words);
    break;
  case '/app/polly':
    process_polly(words);
    break;
  case '/app/log':
    process_log(words);
    break;
  }
}

//
// ファイル毎の読み込み処理
//

function read_file(filename) {
  const lines = readFileSync(filename, 'utf-8').split('\n');

  lines.forEach((line, i) => {
    const words = line.split(' ');
    process_line(words);
  });
}

//
// アクティブなユーザだけを unique ユーザとして取り扱う
//

function check_active() {
  for (const eppn in eppn_dict) {
    const ar = eppn_dict[eppn];
    if (ar[1] == 0 && ar[2] == 0 && ar[3] == 0 && ar[4] == 0 && ar[5] == 0) {
      delete eppn_dict[eppn];
    } else {
      const [ _, org ] = eppn.split('@');
      add_user(org_dict, org, 1);
    }
  }
}

//
// データ出力
//

function write_header() {
  console.log('category,open-directory,open-pptx,output-video,save-video,polly-num,polly-chars,user-num,login-num');
}

function write_array(ar) {
  console.log(ar.join(','));
}

function write_dict(dict) {
  for (const key in dict) {
    write_array(dict[key]);
  }
}

function write_all() {
  write_header();
  write_dict(org_dict);
  write_dict(eppn_dict);
  write_array(error_array);
}

//
// コマンド行の解析
//
// 月指定
//  node aggregate.js 2025-03 <<filenames>>
//
// 期間指定
//  node aggregate.js 2025-03-01 2025-03-31 <<filenames>>
//

function parse_args() {
  if (process.argv[2].length == 7) {
    in_range = (words) => {
      return words[0].startsWith(process.argv[2]);
    };
    files = process.argv.slice(3);
  } else if (process.argv[2].length == 10) {
    in_range = (words) => {
      const date = words[0].slice(0,10);
      return process.argv[2] <= date && date <= process.argv[3];
    };
    files = process.argv.slice(4);
  }
}

//
// main
//

function main() {
  parse_args();

  for (const file of files) {
    read_file(file);
  }

  check_active();
  write_all();
}

main();
