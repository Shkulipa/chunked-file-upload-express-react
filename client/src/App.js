import {useState, useEffect} from "react";
import "./App.css";
import axios from 'axios';

const chunkSize = 10 * 1024;

function App() {
  const [dropzoneActive, setDropzoneActive] = useState(false);
  const [files, setFiles] = useState([]);
  const [currentFileIndex, setCurrentFileIndex] = useState(null);
  const [lastUploadedFileIndex, setLastUploadedFileIndex] = useState(null);
  const [currentChunkIndex, setCurrentChunkIndex] = useState(null);

  function readAndUploadCurrentChunk() {
    const reader = new FileReader();
    const file = files[currentFileIndex];
    if (!file) {
      return;
    }
    const from = currentChunkIndex * chunkSize;
    const to = from + chunkSize;
    const blob = file.slice(from, to);
    reader.onload = e => uploadChunk(e);
    reader.readAsDataURL(blob);
  }

  async function uploadChunk(readerEvent) {
    const file = files[currentFileIndex];
    const data = readerEvent.target.result;
    const params = new URLSearchParams();
    params.set('name', file.name);
    params.set('size', file.name);
    params.set('currentChunkIndex', currentChunkIndex);
    params.set('totalChunks', Math.ceil(file.size / chunkSize));
    const headers = { 'Content-Type': 'application/octet-stream' };
    const url = 'http://localhost:4000/upload?'+params.toString()
    await axios.post(url, data, { headers }).then(res => {
      const file = files[currentFileIndex];
      const filesize = files[currentFileIndex].size;
      const isLastChunk = currentChunkIndex === Math.ceil(filesize / chunkSize) - 1;
      if(isLastChunk) {
        file.finalFilename = res.data.finalFilename;
        setLastUploadedFileIndex(currentFileIndex);
        setCurrentChunkIndex(null);
      } else {
        setCurrentChunkIndex(currentChunkIndex + 1);
      }
    });
  }

  function handleDrop(e) {
    e.preventDefault();
    setFiles([...files, ...e.dataTransfer.files]);
  }

  useEffect(() => {
    if(lastUploadedFileIndex === null) return;

    const isLastFile = lastUploadedFileIndex === files.length - 1;
    const nextFileIndex = isLastFile ? null : currentFileIndex + 1;
    setCurrentFileIndex(nextFileIndex);
  }, [lastUploadedFileIndex])
  

  useEffect(() => {
    if (files.length > 0) {
      if (currentFileIndex === null) setCurrentFileIndex(
        lastUploadedFileIndex === null ? 0 : lastUploadedFileIndex + 1
      );
    }
  }, [files.length]);

  useEffect(() => {
    if (currentFileIndex !== null) setCurrentChunkIndex(0)
  }, [currentFileIndex])

  useEffect(() => {
    if (currentChunkIndex !== null) readAndUploadCurrentChunk()
  }, [currentChunkIndex])

  return (
    <div>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDropzoneActive(true);
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          setDropzoneActive(false);
        }}
        onDrop={(e) => handleDrop(e)}
        className={`dropzone ${dropzoneActive && "active"}`}
      >
        drop file here
      </div>
      <div className="files">
        {files.map((file, fileIndex) => {
          let progress = 0;

          if(file.finalFilename) {
            progress = 100;
          } else {
            const uploading = fileIndex === currentFileIndex;
            const chunks = Math.ceil(file.size / chunkSize);
            if(uploading) {
              progress = Math.round(currentChunkIndex / chunks * 100);
            } else {
              progress = 0;
            }
          }

          return (
            <a
              key={fileIndex}
              className="file"
              target="_blank"
              href={'http://localhost:4000/uploads/'+file.finalFilename}
              rel="noreferrer"
            >
              <div className="name">{file.name}</div>
              <div
                className={`progress ${progress === 100 && 'done'}`}
                style={{ width: progress + '%' }}
              >
                {progress}%
              </div>
            </a>
          )
        })}
      </div>
    </div>
  );
}

export default App;
