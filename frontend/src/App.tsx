import { useRef, useState } from "react";
import "./App.css";

const backendUrl = "http://localhost:3000";

// this will call the backend server, and use server side events to stream the response
const getPromptStream = async (
  prompt: string,
  setResponse: (data: string) => void,
  finishResponse: () => void
) => {
  const eventSource = new EventSource(
    `${backendUrl}/api/prompt?prompt=${prompt}`
  );
  eventSource.onmessage = (e) => {
    if (e.data === "--ENDOFSTREAM--") {
      eventSource.close();
      finishResponse();
      return;
    }

    setResponse(e.data);
  };
};

type ChatBlock = {
  userInput: string;
  response: string;
};

function App() {
  const [prompt, setPrompt] = useState<string | null>(null);
  const [response, setResponse] = useState<string>("");
  const [chatBlocks, setChatBlocks] = useState<ChatBlock[]>([]);
  const latestResponseRef = useRef("");
  const currentChatBlockRef = useRef<ChatBlock | null>(null);

  const setResponseFunc = (data: string) => {
    setResponse((prev) => prev + data);
    latestResponseRef.current += data;
    currentChatBlockRef.current = {
      userInput: prompt ?? "",
      response: latestResponseRef.current,
    };
  };

  const finishResponse = () => {
    const resp = latestResponseRef.current;
    const curr = currentChatBlockRef.current;
    setChatBlocks((prev) => [
      ...prev,
      curr ?? { userInput: prompt ?? "", response: resp },
    ]);

    latestResponseRef.current = "";
    currentChatBlockRef.current = null;
  };

  return (
    <div className="App">
      <div>
        {chatBlocks.map((block, index) => (
          <div key={index}>
            <div>{block.userInput}</div>
            <div>{block.response}</div>
          </div>
        ))}
        {currentChatBlockRef.current != null && (
          <div>
            <div>{currentChatBlockRef.current.userInput}</div>
            <div>{currentChatBlockRef.current.response}</div>
          </div>
        )}
      </div>
      <textarea onChange={(e) => setPrompt(e.target.value)}>{prompt}</textarea>
      <button
        onClick={async () => {
          await getPromptStream(prompt ?? "", setResponseFunc, finishResponse);
        }}
      >
        Get Prompt
      </button>
    </div>
  );
}

export default App;
