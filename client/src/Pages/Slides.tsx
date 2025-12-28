import {useState, useEffect} from 'react';
import axios from 'axios';
import {useParams} from 'react-router-dom';
import GroupSlides from '../components/GroupSlides';

interface Slides {
  _id: string,
  boardId: string,
  slideNo: string,
  imageUrl: string,
}

 const Slides = () => {

  const {boardId} = useParams<{boardId:string}>()
  const [prevSlides, setPrevSlides] = useState<Slides[]>([])

  const fetchPrevSlides = async () => {
    const res = await axios.get(`http://localhost:3000/api/${boardId}/getPrevSlides`)
    // console.log("data: ", res.data.slides);
    setPrevSlides(res.data.slides);
    
  }
  useEffect(() => {
    fetchPrevSlides();
    // console.log("prev slides: ", prevSlides);
  }, []);
  return (
    <div>
      <GroupSlides slides={prevSlides}/>
    </div>
  )
}
export default Slides;
