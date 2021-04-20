const ws = new WebSocket(`ws://localhost:8080`);

const Ludo = () => {
  const [ludoBoard, setludoBoard] = React.useState([]);
  const [diceValue, setdiceValue] = React.useState('');
  const [myColor, setColor] = React.useState('');
  const [turn, setTurn] = React.useState('');

  ws.onmessage = (event) => {
    const serverMessage = JSON.parse(event.data);
    if (serverMessage.type === `newboard`) {
      setludoBoard(serverMessage.board);
    }
    if (serverMessage.type === `dice`) {
      setdiceValue(serverMessage.value);
    }
    if (serverMessage.type === `assignColor`) {
      setColor(serverMessage.color)
    }
    if (serverMessage.type === `turn`) {
      setTurn(serverMessage.player)
    }
    if (serverMessage.type === `wrongturn`) {
      setTurn(serverMessage.msg)
    }
    if (serverMessage.type === `winner`) {
      setTurn(serverMessage.message)
      setludoBoard([])
      setdiceValue('')
    }
    if (serverMessage.type === `connecting`) {
      setTurn(serverMessage.message)
    }

  };

  const onClickHandler = (location, spriteColor) => {
    if (spriteColor != myColor)
    {
      return
    }
    const object_tosend = {type: `spriteclick`,
                          color: spriteColor,
                          coordinates: location,
                          }
    ws.send(JSON.stringify(object_tosend))
  };


  const DisplayBoard = () =>{
    return (<div>
      {ludoBoard.map((row, rowindex)=> {
      return (<div key= {rowindex}>
        {row.map((col, colindex) =>{
          return(<div className={"cell".concat(rowindex.toString(), colindex.toString())} key = {"cell".concat(rowindex.toString(), colindex.toString())}> 
          {col.map((sprites, sprites_index)=>
          {
            return(<div onClick ={()=>onClickHandler([rowindex, colindex,sprites_index],sprites)} className={sprites} key={sprites_index}>  </div>)
          })}
          </div>)           
        })}
        
      </div>)
    })}
    <div className="dice" > 
    {diceValue}
    </div>
    <div className={"color ".concat(myColor)} > 
    </div>
    <div className="text_box">
      {turn}
    </div>
    
    </div>)} ;
    
  
  return (<div>
    <DisplayBoard />
     
  </div>
  );
};

ReactDOM.render(<Ludo />, document.querySelector(`#root`))
