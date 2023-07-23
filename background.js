import jsPDF from 'jspdf';
// import {createCanvas, loadImage} from 'canvas';

chrome.runtime.onInstalled.addListener(() => {
  console.log("Background script is running! hi"); // Add this line to check if the script is running
});
let myAspectRatio;
let aspectRatio=[];
var flag= false;

chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
  if (message.flag==true) {
    console.log("F8 pressed for start");
    flag=true;
  }else if(message.flag==false) {
    console.log("F8 pressed for stop");
    flag=false;
  }else if (message.greeting === "captureImage"&&flag) {
      chrome.tabs.captureVisibleTab((screenshotUrl) => {
        chrome.tabs.sendMessage(sender.tab.id, { greeting: "screenshotUrl", url: screenshotUrl });
        console.log("creating image");
        chrome.storage.local.get({ capturedImages: [] }, (data) => {
          const capturedImages = data.capturedImages;
          capturedImages.push(screenshotUrl);
          chrome.storage.local.set({ capturedImages }, () => {
            console.log("image pushed");
          });
        });
      });
    } else if (message.greeting === "generatePDF"&&flag) {
      console.log("pdf generation start");
      chrome.storage.local.get({ capturedImages: [] }, (data) => {
        const capturedImages = data.capturedImages;
        if (capturedImages.length > 0) {
          generatePDF(capturedImages);
          chrome.storage.local.set({ capturedImages: [] }, () => {
            console.log("capturedImages reset");
          });
        } else {
          console.log("No captured images to generate PDF.");
        }
      });
    }else if (message.greeting==="fetchRatio"&&flag){
      myAspectRatio=message.aspectRatio;
      aspectRatio.push(myAspectRatio);
    }
    
});

function generatePDF(imageUrls) {
  const pdf = new jsPDF({
    orientation: 'landscape',
    unit: 'in',
    format: [612,792]
  });

  const maxImageWidth = 220; // Maximum width for the image, adjust as needed

  let x = 10;
  let y = 10;

  const imagePromises = imageUrls.map((imageUrl) =>
    fetch(imageUrl)
      .then((response) => response.blob())
      .then((blob) => {
        return new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            resolve(reader.result);
          };
          reader.readAsDataURL(blob);
        });
      })
  );

  Promise.all(imagePromises)
    .then((dataURLs) => {
      for(var i = 0; i<dataURLs.length; i++) {
        let dataURL=dataURLs[i];
        const imgWidth = 180;
        if(0.76<=aspectRatio[i]<1)aspectRatio[i]=12/9;
        else if(aspectRatio[i]<0.76)aspectRatio[i]=0.45;
        const imgHeight = imgWidth/aspectRatio[i];
        if (i%2 == 0&&i!=0) {
          pdf.addPage([612,792],'landscape');
          y = 10; 
        }
        pdf.addImage(dataURL, 'JPEG', x, y, imgWidth, imgHeight);
        y += imgHeight + 5;
      }
      
      const pdfBase64 = btoa(pdf.output());
      chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        const activeTab = tabs[0];
        chrome.tabs.sendMessage(activeTab.id, { greeting: 'downloadPDF', pdfData: pdfBase64 });
      });
    })
    .catch((error) => {
      console.error('Error loading images:', error);
    });
}

