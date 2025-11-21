import Board from "./Pages/board.tsx";
import {BrowserRouter, Routes, Route} from 'react-router-dom';
export const App = () => {
  return (
    <div>
        <BrowserRouter>
          <Routes>
            <Route path="/board" element={<Board/>}></Route>
          </Routes>
        </BrowserRouter>   
    </div>
  )
}
