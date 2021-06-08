const { BlobServiceClient } = require("@azure/storage-blob");
const { BlobService } = require("azure-storage");
const { DefaultAzureCredential } = require("@azure/identity");
const { SecretClient } = require("@azure/keyvault-secrets");

const createContainerButton = document.getElementById("create-container-button");
const deleteContainerButton = document.getElementById("delete-container-button");
const selectButton = document.getElementById("select-button");
const fileInput = document.getElementById("file-input");
const listButton = document.getElementById("list-blob-button");
const listContainerButton = document.getElementById("list-container-button");
const deleteButton = document.getElementById("delete-button");
const downloadBlobButton = document.getElementById("download-blob-button");
const inputSASButton = document.getElementById("SAS-TOKEN-URL");
const status = document.getElementById("status");
const fileList = document.getElementById("Blob-list");
const fileList2 = document.getElementById("Container-list");
// "https://demosolutions.blob.core.windows.net/?sv=2020-02-10&ss=bfqt&srt=sco&sp=rwdlacuptfx&se=2021-06-30T08:49:49Z&st=2021-06-06T00:49:49Z&spr=https,http&sig=ak4SG2N891oTfLvC50fB%2FTu5y2akFuOZSQWSw76oHV8%3D"
var blobSasUrl = "";
// "?sv=2020-02-10&ss=bfqt&srt=sco&sp=rwdlacuptfx&se=2021-06-30T09:08:01Z&st=2021-06-06T01:08:01Z&spr=https,http&sig=jWjrISYn39xe8JN1Zkq%2BxyAZGopUH31REyPSCGPDYMo%3D"
var sasToken = "";
// "https://demosolutions.blob.core.windows.net"
var storageAccountLink = "";

const reportStatus = message => {
    status.innerHTML += `${message}<br/>`;
    status.scrollTop = status.scrollHeight;
}

const main = async () => {
    try {
        // var keyVaultName = window.prompt("Key-Vault Name: ","Ex:datahub-2");
        // var KVUri = "https://" + keyVaultName + ".vault.azure.net";
      
        // var credential = new DefaultAzureCredential();
        // var client = new SecretClient(KVUri, credential);
      
        // var secretName = window.prompt("Secret Name: ","EX: SAS Token");
        // var secretValue = await askQuestion("Input your SAS Token > ");
      
        // reportStatus("Creating a secret in " + keyVaultName + " called '" + secretName + "' with the value '" + secretValue + "` ...");
        // await client.setSecret(secretName, secretValue);
      
        // reportStatus("Done.");
      
      
        // reportStatus("Assigning your secret to SAS TOKEN ...");
      
        // sasToken = await client.getSecret(secretName);
      

        // var secretName1 = window.prompt("Secret Name: ","EX: BLOB SAS URL");
        // var secretValue1 = await askQuestion("Input your BLOB SAS URL: ");
      
        // reportStatus("Creating a secret in " + keyVaultName + " called '" + secretName1 + "' with the value '" + secretValue1 + "` ...");
        // await client.setSecret(secretName1, secretValue1);
      
        // reportStatus("Done.");
      
      
        // reportStatus("Assigning your secret to blobSasUrl ...");
      
        // blobSasUrl = await client.getSecret(secretName1);

        blobSasUrl = window.prompt("BLOB SAS URL: ","Ex:https://demosolutions.blob.core.windows.net/?sv=2020-02-10&ss=bfqt&srt=sco&sp=rwdlacuptfx&se=2021-06-30T08:49:49Z&st=2021-06-06T00:49:49Z&spr=https,http&sig=ak4SG2N891oTfLvC50fB%2FTu5y2akFuOZSQWSw76oHV8%3D")
        keyVaultName = window.prompt("sasToken: ","Ex:?sv=2020-02-10&ss=bfqt&srt=sco&sp=rwdlacuptfx&se=2021-06-30T09:08:01Z&st=2021-06-06T01:08:01Z&spr=https,http&sig=jWjrISYn39xe8JN1Zkq%2BxyAZGopUH31REyPSCGPDYMo%3D")
        var storageAccountName = window.prompt("Storage Account Name: ", "Ex:demosolutions")
        storageAccountLink = "https://" + storageAccountName + ".blob.core.windows.net"
        blobServiceClient = new BlobServiceClient(blobSasUrl);
    
      
        
        
    } catch (error) {
        reportStatus(error.message);
    }
};

main();
// Create a new BlobServiceClient
var blobServiceClient = new BlobServiceClient(blobSasUrl);

// Create a unique name for the container by 
// appending the current time to the file name
var containerName = "container" + new Date().getTime();

// Get a container client from the BlobServiceClient
var containerClient = blobServiceClient.getContainerClient(containerName);


const createContainer = async () => {
    try {
        containerName = window.prompt("Container Name (Lowercase Alphanumeric Characters only):","Ex:datahub");
        containerClient = blobServiceClient.getContainerClient(containerName);
        reportStatus(`Creating container "${containerName}"...`);
        await containerClient.create();
        reportStatus(`Done.`);
        listContainers()
    } catch (error) {
        reportStatus(error.message);
    }
};

createContainerButton.addEventListener("click", createContainer);

const listFiles = async () => {
    fileList.size = 0;
    fileList.innerHTML = "";
    try {
        if (fileList2.selectedOptions.length == 1) {
            for (const option of fileList2.selectedOptions) {
                containerName = option.text
            }    
            containerClient = blobServiceClient.getContainerClient(containerName);
            reportStatus("Retrieving file list...");
            let iter = containerClient.listBlobsFlat();
            let blobItem = await iter.next();
            while (!blobItem.done) {
                fileList.size += 1;
                fileList.innerHTML += `<option>${blobItem.value.name}</option>`;
                blobItem = await iter.next();
            }
            if (fileList.size > 0) {
                reportStatus("Done.");
            } else {
                reportStatus("The container- " + containerName + " -does not contain any files.");
            }
        } else if (fileList2.selectedOptions.length > 1){
            reportStatus("Please only select one container")
        } else {
            reportStatus("Unable to retrieve files because no container was selected")
        }
    } catch (error) {
        reportStatus(error.message);
    }
};

listButton.addEventListener("click", listFiles);

const uploadFiles = async () => {
    try {
        if (fileList2.selectedOptions.length == 1) {
            for (const option of fileList2.selectedOptions) {
                containerName = option.text
            }  
            containerClient = blobServiceClient.getContainerClient(containerName);
            reportStatus("Uploading files...");
            const promises = [];
            for (const file of fileInput.files) {
                const blockBlobClient = containerClient.getBlockBlobClient(file.name);
                promises.push(blockBlobClient.uploadBrowserData(file));
            }
            await Promise.all(promises);
            reportStatus("Done.");
            listFiles();  
        } else if (fileList2.selectedOptions.length > 1){
            reportStatus("Please only select one container")
        } else {
            reportStatus("Unable to upload files to container because no container was selected")
        }
    }
    catch (error) {
            reportStatus(error.message);
    }
}

selectButton.addEventListener("click", () => fileInput.click());
fileInput.addEventListener("change", uploadFiles);

const deleteFiles = async () => {
    try {
        if (fileList.selectedOptions.length > 0) {
            reportStatus("Deleting files...");
            for (const option of fileList.selectedOptions) {
                reportStatus("Deleted File: " + option.text);
                await containerClient.deleteBlob(option.text);
            }
            reportStatus("Done.");
            listFiles();
        } else {
            reportStatus("No files selected.");
        }
    } catch (error) {
        reportStatus(error.message);
    }
};

deleteButton.addEventListener("click", deleteFiles);

const listContainers = async () => {
    fileList2.size = 0;
    fileList2.innerHTML = "";
    try {
        reportStatus("Retrieving container list...");
        let iter = blobServiceClient.listContainers();
        let blobItem = await iter.next();
        while (!blobItem.done) {
            fileList2.size += 1;
            fileList2.innerHTML += `<option>${blobItem.value.name}</option>`;
            blobItem = await iter.next();
        }
        if (fileList2.size > 0) {
            reportStatus("Done.");
        } else {
            reportStatus("The storage has no containers");
        }
    } catch (error) {
        reportStatus(error.message);
    }
};

listContainerButton.addEventListener("click", listContainers);

const deleteContainer = async () => {
    try {
        if (fileList2.selectedOptions.length > 0) {
            reportStatus("Deleting Containers...");
            for (const option of fileList2.selectedOptions) {
                reportStatus("Deleted Container: " + option.text);
                await blobServiceClient.getContainerClient(option.text).delete();
            }
            reportStatus("Done.");
            listContainers();
        } else {
            reportStatus("No Containers selected.");
        }
    } catch (error) {
        reportStatus(error.message);
    }
};

deleteContainerButton.addEventListener("click", deleteContainer);

const downloadFiles = async () => {
    try {
        listContainers()
        reportStatus("Downloading File Links");
        containerName = window.prompt("Container Name for downloads (pick from listed containers):","Ex:datahub");       
        if (fileList.selectedOptions.length > 0){
            for (const option of fileList.selectedOptions) {
                var downloadLink = storageAccountLink + '/' + containerName + '/' + option.text + sasToken;
                var link = document.createElement("a");
                link.download = option.text;
                link.href = downloadLink;
                link.click();
                reportStatus("\ndownloadLink\n")
            } 
        }else{
            reportStatus("No Blobs Were Selected");
        }
    } catch (error) {
        reportStatus(error.message);
    }
};



downloadBlobButton.addEventListener("click", downloadFiles);