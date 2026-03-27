class SheepGame {
    constructor() {
        this.cardTypes = ['🐑', '🌾', '🎯', '🎨', '🎵', '🎭', '🎮', '🎯', '🎨', '🎵', '🎭', '🎮'];
        this.cards = [];
        this.sidebarCards = [];
        this.score = 0;
        this.level = 1;
        this.maxSidebarCards = 4;
        this.cardPositions = [];
        this.history = []; // 操作历史
        
        this.initElements();
        this.initEventListeners();
    }
    
    initElements() {
        this.cardStack = document.getElementById('cardStack');
        this.sidebar = document.getElementById('sidebar');
        this.scoreElement = document.getElementById('score');
        this.levelElement = document.getElementById('level');
        this.gameOverElement = document.getElementById('gameOver');
        this.gameStartElement = document.getElementById('gameStart');
        this.finalScoreElement = document.getElementById('finalScore');
        this.startBtn = document.getElementById('startBtn');
        this.restartBtn = document.getElementById('restartBtn');
    }
    
    initEventListeners() {
        this.startBtn.addEventListener('click', () => this.startGame());
        this.restartBtn.addEventListener('click', () => this.restartGame());
    }
    
    startGame() {
        this.gameStartElement.style.display = 'none';
        this.resetGame();
        this.generateCards();
        this.renderCards();
    }
    
    restartGame() {
        this.gameOverElement.style.display = 'none';
        this.resetGame();
        this.generateCards();
        this.renderCards();
    }
    
    resetGame() {
        this.cards = [];
        this.sidebarCards = [];
        this.score = 0;
        this.level = 1;
        this.history = [];
        this.updateScore();
        this.updateLevel();
        this.cardStack.innerHTML = '';
        this.sidebar.innerHTML = '';
    }
    
    generateCards() {
        const cardCount = 12 * 3; // 每种卡片3张
        this.cards = [];
        
        // 创建卡片位置网格（5x5网格，参照图片）
        const gridSize = 5;
        const positions = [];
        for (let row = 0; row < gridSize; row++) {
            for (let col = 0; col < gridSize; col++) {
                positions.push({ row, col });
            }
        }
        
        // 打乱位置
        this.shuffleArray(positions);
        
        // 生成卡片并分配位置和层级
        for (let i = 0; i < cardCount; i++) {
            const type = this.cardTypes[i % this.cardTypes.length];
            const pos = positions[i % positions.length];
            // 计算层级：使用更复杂的算法，增加堆叠深度和随机性
            const zIndex = (pos.row * gridSize * 2) + (pos.col * 2) + Math.floor(Math.random() * 5);
            
            this.cards.push({ 
                id: i, 
                type, 
                selected: false,
                row: pos.row,
                col: pos.col,
                zIndex: zIndex
            });
        }
        
        // 确保卡片按层级排序
        this.cards.sort((a, b) => a.zIndex - b.zIndex);
    }
    
    shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }
    
    renderCards() {
        this.cardStack.innerHTML = '';
        
        // 按层级渲染卡片
        this.cards.sort((a, b) => a.zIndex - b.zIndex).forEach(card => {
            const cardElement = document.createElement('div');
            cardElement.className = 'card';
            cardElement.textContent = card.type;
            cardElement.dataset.id = card.id;
            cardElement.style.position = 'absolute';
            
            // 计算卡片位置（5x5网格，参照图片）
            const gridSize = 5;
            const cardWidth = 18; // 卡片宽度百分比
            const cardHeight = 25; // 卡片高度百分比
            const horizontalGap = (100 - (gridSize * cardWidth)) / (gridSize + 1); // 水平间距
            const verticalGap = (100 - (gridSize * cardHeight)) / (gridSize + 1); // 垂直间距
            
            // 计算卡片左上角位置，使用卡片的原始行列位置
            const left = horizontalGap + (card.col * (cardWidth + horizontalGap));
            const top = verticalGap + (card.row * (cardHeight + verticalGap));
            
            cardElement.style.left = `${left}%`;
            cardElement.style.top = `${top}%`;
            cardElement.style.width = `${cardWidth}%`;
            cardElement.style.height = `${cardHeight}%`;
            cardElement.style.zIndex = card.zIndex;
            
            // 检查卡片是否可以点击（是否在最上层）
            const isClickable = this.isCardClickable(card);
            if (isClickable) {
                cardElement.style.cursor = 'pointer';
                cardElement.style.opacity = '1'; // 完全不透明表示可点击
                cardElement.addEventListener('click', () => this.selectCard(card.id));
            } else {
                cardElement.style.cursor = 'default';
                cardElement.style.opacity = '0.5'; // 半透明表示不可点击
            }
            
            this.cardStack.appendChild(cardElement);
        });
    }
    
    isCardClickable(card) {
        // 检查卡片是否在最上层
        const samePositionCards = this.cards.filter(c => c.row === card.row && c.col === card.col);
        if (samePositionCards.length === 0) return false;
        
        // 找到该位置的最高层级卡片
        const topCard = samePositionCards.reduce((max, current) => 
            current.zIndex > max.zIndex ? current : max
        );
        
        // 如果当前卡片是最高层级的，则可以点击
        return topCard.id === card.id;
    }
    
    selectCard(cardId) {
        const card = this.cards.find(c => c.id === cardId);
        if (!card) return;
        
        if (this.sidebarCards.length >= this.maxSidebarCards) {
            this.gameOver();
            return;
        }
        
        // 记录操作历史
        this.history.push({
            type: 'select',
            card: {...card},
            sidebarCards: [...this.sidebarCards]
        });
        
        this.sidebarCards.push(card.type);
        this.renderSidebar();
        this.checkMatches();
        
        // 从卡片堆中移除选中的卡片
        this.cards = this.cards.filter(c => c.id !== cardId);
        // 重新渲染卡片，但保持其他卡片的位置不变
        this.renderCards();
        
        // 检查是否所有卡片都已消除
        if (this.cards.length === 0 && this.sidebarCards.length === 0) {
            this.nextLevel();
        }
    }
    
    undo() {
        if (this.history.length === 0) return;
        
        const lastAction = this.history.pop();
        if (lastAction.type === 'select') {
            // 恢复卡片到卡片堆
            this.cards.push(lastAction.card);
            // 恢复边栏的卡片
            this.sidebarCards = lastAction.sidebarCards;
            // 重新渲染
            this.renderCards();
            this.renderSidebar();
        }
    }
    
    renderSidebar() {
        this.sidebar.innerHTML = '';
        this.sidebarCards.forEach((type, index) => {
            const cardElement = document.createElement('div');
            cardElement.className = 'card';
            cardElement.textContent = type;
            cardElement.dataset.index = index;
            cardElement.style.width = '100%';
            cardElement.style.aspectRatio = '3/4';
            cardElement.addEventListener('click', () => this.removeSidebarCard(index));
            this.sidebar.appendChild(cardElement);
        });
    }
    
    removeSidebarCard(index) {
        this.sidebarCards.splice(index, 1);
        this.renderSidebar();
    }
    
    checkMatches() {
        const counts = {};
        this.sidebarCards.forEach(type => {
            counts[type] = (counts[type] || 0) + 1;
        });
        
        for (const type in counts) {
            if (counts[type] >= 3) {
                this.sidebarCards = this.sidebarCards.filter(t => t !== type);
                this.score += 10;
                this.updateScore();
                this.renderSidebar();
            }
        }
    }
    
    shuffleCards() {
        this.shuffleArray(this.cards);
        this.renderCards();
    }
    
    removeCard() {
        if (this.sidebarCards.length > 0) {
            this.sidebarCards.pop();
            this.renderSidebar();
        }
    }
    
    hintCard() {
        // 简单提示：如果有两张相同的卡片，高亮显示
        const counts = {};
        this.sidebarCards.forEach(type => {
            counts[type] = (counts[type] || 0) + 1;
        });
        
        for (const type in counts) {
            if (counts[type] === 2) {
                // 找到堆中相同类型的卡片并高亮
                const cards = this.cardStack.querySelectorAll('.card');
                cards.forEach(card => {
                    if (card.textContent === type) {
                        card.style.border = '2px solid yellow';
                        setTimeout(() => {
                            card.style.border = '';
                        }, 2000);
                    }
                });
                break;
            }
        }
    }
    
    nextLevel() {
        this.level++;
        this.updateLevel();
        this.generateCards();
        this.renderCards();
    }
    
    gameOver() {
        this.finalScoreElement.textContent = this.score;
        this.gameOverElement.style.display = 'flex';
    }
    
    updateScore() {
        this.scoreElement.textContent = this.score;
    }
    
    updateLevel() {
        this.levelElement.textContent = this.level;
    }
}

// 初始化游戏
window.addEventListener('DOMContentLoaded', () => {
    new SheepGame();
});