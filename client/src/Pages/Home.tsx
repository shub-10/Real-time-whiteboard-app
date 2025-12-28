import {useState} from 'react';
import { useNavigate } from 'react-router-dom';
import {generateBoardId} from '../utils/boardId.tsx';
const Home = () => {
  const navigate = useNavigate();
  const [joinCode, setJoinCode] = useState("");


  const handleNewBoard: React.MouseEventHandler<HTMLButtonElement> = (e) => {
    e.preventDefault();
    const id =  generateBoardId();
    console.log(id);
    navigate(`/board/${id}`);
  };
  const handleJoin: React.MouseEventHandler<HTMLButtonElement> = (e) => {
    e.preventDefault();
    const code = joinCode.trim();
    if(!code) return;
    const boardId = code.includes('/board/') ? code.split('/board/')[1].split('/')[0] : code;
    console.log(boardId);
    navigate(`/board/${boardId}`);
  }
  return (
    <div className="w-full h-screen relative flex flex-col justify-center items-center px-4">
      
      <h1 className="text-4xl md:text-5xl font-semibold text-gray-800 text-center">
        Collaborate and create together
      </h1>

      <p className="text-lg text-gray-500 mt-4 text-center max-w-2xl">
        Start a new whiteboard or join an existing one instantly.
      </p>

      <div className="flex flex-col md:flex-row items-center gap-4 mt-8">


        <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-full text-lg shadow-lg transition" onClick={handleNewBoard}>
          New board
        </button>


        <div className="flex items-center bg-white shadow-md rounded-full px-4 py-2 border border-gray-200 w-full md:w-auto">
          <input
            className="outline-none px-2 py-1 flex-1"
            placeholder="Enter a code or link"
            value = {joinCode}
            onChange= {(e)=> setJoinCode(e.target.value)}
          />
        </div>

        <button className="text-blue-600 font-medium text-lg hover:underline" onClick={handleJoin}>
          Join
        </button>
      </div>

      <div className="w-3/4 md:w-1/2 mt-8 border-t border-gray-300" />
      

    </div>
  );
};

export default Home;
