var flag= false;
document.addEventListener("keydown", (event) => {
  if (event.key === 'F8') {
    if(flag==false){
      flag=true;
      console.log("F8 pressed for start");
      chrome.runtime.sendMessage({ flag: true, greeting:'' });
    }else if(flag==true){
      flag=false;
      console.log("F8 pressed for stop");
      chrome.runtime.sendMessage({ flag: false, greeting:'' });
    }
  }else if (event.key === 'a') {
    console.log("a pressed for capture");
    chrome.runtime.sendMessage({ flag:null,greeting: 'captureImage' });
} else if (event.key === 'z') {
  console.log("z pressed for pdf");
    chrome.runtime.sendMessage({ flag:null,greeting: 'generatePDF' });
}
});


chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
  if(message.greeting==='setFlag'){
    if(message.flag===false)flag=false; else if(message,flag===true) flag=true;
  }
  else if (message.greeting === 'downloadPDF') {
    const pdfData = message.pdfData;
    const pdfBlob = base64ToBlob(pdfData, 'application/pdf');

    // Convert the PDF Blob to a data URL
    const pdfDataURL = URL.createObjectURL(pdfBlob);

    const downloadLink = document.createElement('a');
    downloadLink.href = pdfDataURL;
    downloadLink.download = 'screenshot.pdf';
    downloadLink.textContent = 'Click here to download the PDF';
    document.body.appendChild(downloadLink);
    downloadLink.click();

  // Remove the link element
  downloadLink.remove();

  //   const downloadPrompt = `Click the link below to download the PDF:\n\n${pdfDataURL}`;
  // window.prompt(downloadPrompt, pdfDataURL);
  } else if (message.greeting === 'screenshotUrl') {
    const img = new Image();
    img.src=message.url // This is needed to bypass CORS restrictions
    img.onload = function () {
      const aspectRatio = img.naturalWidth / img.naturalHeight;
      console.log("Aspect Ratio:", aspectRatio);
      chrome.runtime.sendMessage({ greeting:"fetchRatio", aspectRatio:aspectRatio  });
    };
    console.log('ratio fetched');
  }
});

function base64ToBlob(base64, type) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);

  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  return new Blob([bytes], { type });
}
