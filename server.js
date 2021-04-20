const fs = require(`fs`);
const http = require(`http`);
const WebSocket = require(`ws`); // npm i ws

const readFile = (fileName) =>
  new Promise((resolve, reject) => {
    fs.readFile(fileName, `utf-8`, (readErr, fileContents) => {
      if (readErr) {
        reject(readErr);
      } else {
        resolve(fileContents);
      }
    });
  });

const readPng = (fileName) =>
  new Promise((resolve, reject) => {
    fs.readFile(fileName, (readErr, fileContents) => {
      if (readErr) {
        reject(readErr);
      } else {
        resolve(fileContents);
      }
    });
  });

const server = http.createServer(async (req, resp) => {
  console.log(`browser asked for ${req.url}`);
  if (req.url == `/mydoc`) {
    const clientHtml = await readFile(`client.html`);
    resp.end(clientHtml);
  } else if (req.url == `/myjs`) {
    const clientJs = await readFile(`client.js`);
    resp.end(clientJs);
  } else if (req.url == `/ludo.css`) {
    const ludoCss = await readFile(`ludo.css`);
    resp.end(ludoCss);
  } else if (req.url == `/center.png`) {
    const centerImg = await readPng(`center.png`);
    resp.end(centerImg);
  } else {
    resp.end(`Not found`);
  }
});

server.listen(8000);


const newBoard = () => {
  let board = new Array(15);
  for (let i = 0; i < 15; i++)
  {
    board[i] = new Array(15);
    for (let j = 0; j <15; j++)
    {
      if (i == 0 && j ==0)
      {
        board[i][j] = ['blue', 'blue', 'blue', 'blue']
      }
      else if (i == 0 && j ==14)
      {
        board[i][j] = ['red', 'red', 'red', 'red']
      }
      else if (i == 14 && j ==0)
      {
        board[i][j] = ['yellow', 'yellow', 'yellow', 'yellow']
      }
      else if (i == 14 && j ==14)
      {
        board[i][j] = ['green', 'green', 'green', 'green']
      }
      else
      {
        board[i][j] = []
      } 
    }
  }
  return board;
}
//global declarations
let ludoBoard = newBoard();
//let ludoBoard = myBoard;
const wss = new WebSocket.Server({ port: 8080 });

const step = (color, ox, oy, steps) => {
  const transform = ([ox,oy]) => ({'blue': [+ox,+oy], 'green': [-ox,-oy], 'red': [-oy,+ox], 'yellow': [+oy,-ox]}[color])
  const path = ['-7,-7', '-1,-6', '-1,-5', '-1,-4', '-1,-3', '-1,-2', '-2,-1', '-3,-1', '-4,-1', '-5,-1', '-6,-1', '-7,-1', '-7,0', '-7,1', '-6,1', '-5,1', '-4,1', '-3,1', '-2,1', '-1,2', '-1,3', '-1,4','-1,5', '-1,6', '-1,7', '0,7', '1,7', '1,6', '1,5', '1,4', '1,3',
  '1,2', '2,1', '3,1', '4,1', '5,1', '6,1', '7,1', '7,0', '7,-1', '6,-1', '5,-1', '4,-1', '3,-1', '2,-1', '1,-2', '1,-3', '1,-4', '1,-5','1,-6', '1,-7', '0,-7', '0,-6', '0,-5', '0,-4', '0,-3', '0,-2', '0,-1']
  const [x,y] = transform(transform(transform(path[path.indexOf(transform([ox-7, oy-
                7]).join(','))+steps].split(','))))
  return [x+7,y+7]
}

const iskilled = (ox, oy) => (ox-7)*(ox-7)+(oy-7)*(oy-7) == 98
let diceValue = Math.floor(Math.random()*6 + 1)
let numPlayers = 0
const turns = ['blue', 'red', 'green', 'yellow']
let turn = 0
const safeSpots = [[6,1],[8,2],[6,12],[8,13],[2,6],[1,8],[12,8],[13,6]]

//checks winning condition
const checkWin = (rowindex, colindex) => {
  return (ludoBoard[rowindex][colindex].length === 4)
}

//checks if sprites coordinates are winning coordinates
const checkWinCoord = (rowindex,colindex) => {
  if (rowindex == 7 && (colindex == 6 || colindex == 8))
  {
    return true
  }
  else if (colindex == 7 && (rowindex == 6 || rowindex == 8))
  {
    return true
  }
  else
  {
    return false
  }
}

wss.on(`connection`, (ws) => {
  console.log(`A user connected`);
  numPlayers = numPlayers + 1
  //sending empty board to that user
  if (numPlayers == 1)
  {
    ws.send(JSON.stringify({type: `assignColor`,
                            color: 'blue',
                            }));
    ws.send(JSON.stringify({type: `connecting`,
                            message: 'Waiting for other players to connect',
                            }));
  }
  else if (numPlayers == 2)
  {
    ws.send(JSON.stringify({type: `assignColor`,
                            color: 'red',
                        }));
    ws.send(JSON.stringify({type: `connecting`,
                            message: 'Waiting for other players to connect',
                            }));
  }
  else if (numPlayers == 3)
  {
    ws.send(JSON.stringify({type: `assignColor`,
                            color: 'green',
                        }));
    ws.send(JSON.stringify({type: `connecting`,
                            message: 'Waiting for other players to connect',
                            }));
  }
  else if (numPlayers == 4)
  {
    ws.send(JSON.stringify({type: `assignColor`,
                            color: 'yellow',
                            }));


    wss.clients.forEach((client)=> {
      if (client.readyState === WebSocket.OPEN) {  
        client.send(JSON.stringify({type: `newboard`,
                                    board: ludoBoard,
                                  }));
        client.send(JSON.stringify({type: `dice`,
                                    value: diceValue,
                                    }));
        client.send(JSON.stringify({type: `turn`,
                                    player: "its ".concat(turns[turn],"'s turn"),
                                    }));                          
      }
    });
  }
  else
  {
    console.log(`ludo cant have more than 4`)
    
  }

  ws.on(`message`, (message) => {
    console.log(`received: ${message}`);
    const clientMessage = JSON.parse(message);
    if (clientMessage.type == `spriteclick`)
    {
      if (turns[turn]!= clientMessage.color)
      {
        ws.send(JSON.stringify({type: `wrongturn`,
                                msg: 'it is not your turn',
                                }));
        return            
      }
      const [rowindex,colindex,spriteindex] = clientMessage.coordinates
      const color = clientMessage.color
      let move_sprite = 0
      let isSafe = false
      //conditions for how much a sprite can move
      if (iskilled(rowindex,colindex) && diceValue===6)//at home and got 6
      {
        move_sprite = 1
      }
      else if (iskilled(rowindex,colindex) && diceValue !=6) // remain at home because dice not 6
      {
        move_sprite = 0
      }
      else if (checkWinCoord(rowindex,colindex)) // if already at winning
      {
        move_sprite = 0
      }
      else if ( (rowindex == 7) && (colindex > 0) && (color == 'blue' || color == 'green')) //no sprite moves beyonf last position
      {
        if (color == 'blue' && ((colindex+ diceValue) > 6))
        {
          move_sprite = 0
        }
        else if (color == 'green' && ((colindex - diceValue) < 8))
        {
          move_sprite = 0
        }
        else
        {
          move_sprite = diceValue
        }

      }
      else if ( (rowindex > 0) && (colindex == 7) && (color == 'red' || color == 'yellow')) // no sprite moves beyond last position
      {
        if (color == 'red' && ((rowindex + diceValue) > 6))
        {
          move_sprite = 0
        }
        else if (color == 'yellow' && ((rowindex - diceValue) < 8))
        {
          move_sprite = 0
        }
        else
        {
          move_sprite = diceValue
        }
        
      }
      else
      {
        move_sprite = diceValue
      }

      diceValue = Math.floor(Math.random()*6 + 1)
      ludoBoard[rowindex][colindex].splice(spriteindex,1)
      let [update_x, update_y] = step(color,rowindex,colindex,move_sprite)
      if (ludoBoard[update_x][update_y].length === 0)
      {
        ludoBoard[update_x][update_y].push(color)
        turn = (turn+1)%4 
      }
      else
      {
          for(let i=0; i< safeSpots.length; i++) //checks if spot is safe then push sprite
          {
            [x,y] = safeSpots[i]
            if ( (x == update_x) && (y == update_y))
            {
              ludoBoard[update_x][update_y].push(color)
              isSafe = true
              turn = (turn+1)%4
              break
            }
          }
          if (!isSafe) 
          {
            //console.log(`issafe before ${isSafe}`)
            if (ludoBoard[update_x][update_y][0] != color) //kill sprites
            {
              for(let i =0; i< ludoBoard[update_x][update_y].length; i++) //move killed sprites to home
              {
                if (ludoBoard[update_x][update_y][i] == 'blue')
                {
                  ludoBoard[0][0].push('blue')
                }
                else if (ludoBoard[update_x][update_y][i] == 'red')
                {
                  ludoBoard[0][14].push('red')
                }
                else if (ludoBoard[update_x][update_y][i] == 'yellow')
                {
                  ludoBoard[14][0].push('yellow')
                }
                else
                {
                  ludoBoard[14][14].push('green')
                }
              }
              ludoBoard[update_x][update_y] = [color] //kill it
            }
            else
            {
              ludoBoard[update_x][update_y].push(color)
              turn = (turn+1)%4
            }      
          }
      }
      isSafe = false

      if (checkWinCoord(update_x, update_y) && checkWin(update_x, update_y)) //checks if player has won
      {
          wss.clients.forEach((client)=> {
            if (client.readyState === WebSocket.OPEN) {  
              client.send(JSON.stringify({type: `winner`,
                                          message: color.concat(" has won. Game Over"),
                                          }));                          
            }
          });
        
      }
      else
      {
        wss.clients.forEach((client)=> {
          if (client.readyState === WebSocket.OPEN) {  
            client.send(JSON.stringify({type: `newboard`,
                                        board: ludoBoard,
                                      }));
            client.send(JSON.stringify({type: `dice`,
                                        value: diceValue,
                                        }));
            client.send(JSON.stringify({type: `turn`,
                                        player: "its ".concat(turns[turn],"'s turn"),
                                        }));                          
          }
        });
      }
      
    }


  });

});
