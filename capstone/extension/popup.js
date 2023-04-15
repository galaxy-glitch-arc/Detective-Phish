

async function sleep(time) {
  return new Promise(resolve => setTimeout(resolve, time));
}

//[[{"label":"1","score":0.8290777802467346},{"label":"0","score":0.17092224955558777}]]
//{"error":"Model galaxy-cat/autotrain-phish-45776114415 is currently loading","estimated_time":20}
async function query(data) {
  return fetch(
    //"https://api-inference.huggingface.co/models/galaxy-cat/autotrain-phish-45776114415",
    "https://api-inference.huggingface.co/models/galaxy-cat/autotrain-detective-phish-49334119200",
    {
      headers: { Authorization: "Bearer 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" },
      method: "POST",
      body: JSON.stringify(data),
    }
  )
}

async function analyze(data) {

  await sleep(3000)

  //try 20x once every 10 seconds
  for (let i = 0; i < 20; i++) {
    try {
      const resp = await query(data)
      if (resp.ok) {
        const respData = await resp.json()
        if (Array.isArray(respData)) {
          return respData
        }
      }
    } catch (e) {
      document.getElementById('status').innerHTML = e
    }

    await sleep(10000)
  }

}




chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {

  const statusEl = document.getElementById('status')
  const imgEl = document.getElementById('image')
  const url = tabs[0].url.replace('https://', '')
  statusEl.innerHTML = `Analyzing...<br/><p style="font-size:12px">( this could take 30 seconds if the servers are sleeping )</p>`

  analyze({ "inputs": url }).then((response) => {
    const prediction = response[0]

    const isPhish = prediction.find((item) => item.label == '1')
    const isNotPhish = prediction.find((item) => item.label == '0')

    const message = `Safety score: ${((isNotPhish.score) * 100).toFixed(2)}%`

    let explain = '';
    if (isNotPhish.score > .75) {
      imgEl.src = './yes.png'
      explain = `This website looks good to me!`
    } else if (isNotPhish.score > .3) {
      imgEl.src = './maybe.png'
      explain = `I'm not too sure about this website, I suggest you proceed with caution.`
    } else {
      imgEl.src = './no.png'
      explain = `Something is Phishy here. I strongly recommend you leave this website.`
    }

    statusEl.innerHTML = message
    document.getElementById('explain').innerHTML = explain
  })


})