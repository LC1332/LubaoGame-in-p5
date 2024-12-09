let timer
let array
let maxRes = 30
let lastMergeTime = 0
let lastSpawnTime = 0
let spawnCooldown = 500
let scale = 1  // 缩放系数
let baseWidth = 500  // 基础宽度
let baseHeight = 600 // 基础高度
let mergeDisplay = {
    text: '',
    startTime: 0,
    duration: 1000
}
let fruitColors = [
    '#f32223',
    '#ac6cff',
    '#f7ba00',
    '#fa080e',
    '#fdef9d',
    '#ffb5ac',
    '#f8ee11',
    '#9fdd0f',
    '#42b307'
]

function setup() {
    // 计算缩放比例
    scale = min(windowWidth / baseWidth, windowHeight / baseHeight)
    
    // 创建适应屏幕的画布
    new Canvas(baseWidth * scale, baseHeight * scale)
    background('#f7f2c8')
    world.gravity.y = 15;
    
    let walls = []
    // 缩放墙壁的位置和大小
    walls.push(new Sprite(250 * scale, 595 * scale, 500 * scale, 10 * scale, 'static'))
    walls.push(new Sprite(5 * scale, 300 * scale, 10 * scale, 600 * scale, 'static'))
    walls.push(new Sprite(495 * scale, 300 * scale, 10 * scale, 600 * scale, 'static'))
    
    walls.forEach(wall =>{
        wall.color = color('#f6d581')
        wall.stroke = color('#f6d581')
    })
    
    curr = null
    timer = 0
    array = []
}

function draw() {
    background('#f7f2c8')
    
    let currentTime = millis()
    
    if(!curr && currentTime - lastSpawnTime >= spawnCooldown){
        let newI = int(random(1, 11))
        // 缩放生成位置和大小
        let randomX = random(30 * scale, 470 * scale)
        curr = new Fruit(newI, new Sprite(randomX, 25 * scale, (10 + newI * 10) * scale, 'd'))
        lastSpawnTime = currentTime
    }
    
    if(curr){
        curr.sprite.y = 25 * scale
        curr.sprite.vel.y = 0
    }
    
    if(currentTime - lastMergeTime >= 1500) {
        for(let i = 0; i < array.length; i++){
            for(let j = 0; j < array.length; j++){
                if(i !== j && 
                   myCollides(array[i].sprite, array[j].sprite) && 
                   !array[i].removed && 
                   !array[j].removed &&
                   (array[i].i <= 10 || array[j].i <= 10) &&
                   (array[i].i + array[j].i < maxRes))
                {
                    let a = array[i].sprite
                    let b = array[j].sprite
                    
                    let newX = (a.x + b.x)/2
                    let newY = (a.y + b.y)/2
                    let newI = array[i].i + array[j].i
                    let newSprite = new Sprite(newX, newY, (10 + newI * 10) * scale, 'd')
                    array.push(new Fruit(newI, newSprite))
                    
                    array[i].removed = true
                    array[j].removed = true
                    
                    array[i].sprite.remove()
                    array[j].sprite.remove()
                    
                    lastMergeTime = currentTime
                    mergeDisplay = {
                        text: `${array[i].i} + ${array[j].i} = ${newI}`,
                        startTime: currentTime,
                        duration: 1000
                    }
                    break
                }
            }
            if(currentTime - lastMergeTime < 1500){
                break
            }
        }
    }
    
    array = array.filter(x => !x.removed)
    
    if(true) {
        push()
        textAlign(CENTER, CENTER)
        // 缩放文字大小
        textSize(30 * scale)
        fill(0)
        text(mergeDisplay.text, width/2, height/4)
        pop()
    }
}

function keyPressed() {
    let currentTime = millis()
    
    if(key === 'r' || key === 'R') {
        for(let fruit of array) {
            if(fruit.sprite) {
                fruit.sprite.remove()
            }
        }
        array = []
        if(curr && curr.sprite) {
            curr.sprite.remove()
        }
        curr = null
        mergeDisplay.text = ''
        lastSpawnTime = currentTime
        lastMergeTime = currentTime
        return
    }
    
    if(currentTime - lastSpawnTime >= spawnCooldown) {
        if(curr) {
            array.push(curr)
            curr = null
            lastSpawnTime = currentTime
        }
    }
}

function myCollides(a,b){
    return dist(a.x,a.y,b.x,b.y) < 2 * scale + a.d
}

class Fruit{
    constructor(i, sprite){
        this.removed = false
        this.i = i
        this.sprite = sprite
        this.sprite.draw = () => {
            push()
            fill(fruitColors[this.i % fruitColors.length])
            stroke(10)
            ellipse(0, 0, this.sprite.d, this.sprite.d)
            
            fill(0)
            noStroke()
            textAlign(CENTER, CENTER)
            // 缩放文字大小
            textSize(this.sprite.d * 0.4)
            text(this.i, 0, 0)
            
            pop()
        }        
    }
}

// 添加窗口大小改变时的处理
function windowResized() {
    // 重新计算缩放比例
    scale = min(windowWidth / baseWidth, windowHeight / baseHeight)
    // 调整画布大小
    resizeCanvas(baseWidth * scale, baseHeight * scale)
    
    // 更新所有现有小球的大小和位置
    if(curr && curr.sprite) {
        curr.sprite.d = (10 + curr.i * 10) * scale
    }
    
    for(let fruit of array) {
        if(fruit.sprite) {
            fruit.sprite.d = (10 + fruit.i * 10) * scale
            // 等比例调整位置
            fruit.sprite.x = fruit.sprite.x * (baseWidth * scale / width)
            fruit.sprite.y = fruit.sprite.y * (baseHeight * scale / height)
        }
    }
}