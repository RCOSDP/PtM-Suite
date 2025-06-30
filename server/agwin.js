//
//  node agwin.js 2025-03-01 2025-03-31 <<days>> <<args>>
//

const start = new Date(process.argv[2]);
const end = new Date(process.argv[3]);
const days = parseInt(process.argv[4]);
const params = process.argv.slice(5);

function print_days() {
  const cur = new Date(start);
  while(cur <= end) {
    const cend = new Date(cur);
    cend.setUTCDate(cend.getUTCDate() + days - 1);
    const cur_str = cur.toISOString().slice(0,10);
    const end_str = (cend <= end ?cend:end).toISOString().slice(0,10);

    console.log('node aggregate.js', cur_str, end_str, params.join(' '));

    cur.setUTCDate(cur.getUTCDate() + days);
  }
}

print_days();
