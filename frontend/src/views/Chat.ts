import { t } from "../translations/index.js";
import { wsService } from "../services/WebSocketService.js";
import { API_ENDPOINTS } from "../config/api.js";
import { fetchAvatarUrl } from "./Header.js";
import { navigate } from "../main.js";

const MAX_MESSAGES = 10;


const getChatKey = (id1: number, id2: number): string => {
    const numId1 = parseInt(String(id1), 10);
    const numId2 = parseInt(String(id2), 10);
    const ids = [numId1, numId2].sort((a, b) => a - b);
    return `chat_history_${ids[0]}_${ids[1]}`;
};

const saveMessage = (senderId: number, receiverId: number, message: string, isSelf: boolean) => {
    const key = getChatKey(senderId, receiverId);
    const historyJson = localStorage.getItem(key);
    
    let history = historyJson ? JSON.parse(historyJson) : [];
    
    const newMessage = {
        senderId: senderId,
        message: message,
        timestamp: new Date().toISOString(),
        isSelf: isSelf 
    };
    
    history.push(newMessage);
    localStorage.setItem(key, JSON.stringify(history));
};

const renderHistory = (messages: any[], msgContainer: HTMLElement) => {
    if (!messages || messages.length === 0) return;

    const messagesToRender = messages.slice(-MAX_MESSAGES);

    messagesToRender.forEach((msg: any) => {
        const msgEl = document.createElement("div");
        
        if (msg.isSelf) {
            msgEl.className = "bg-poke-blue text-white p-2 rounded-xl max-w-[80%] ml-auto shadow";
        } else {
            msgEl.className = "bg-gray-200 text-poke-dark p-2 rounded-xl max-w-[80%] mr-auto shadow";
        }
        
        msgEl.textContent = msg.message;
        msgContainer.appendChild(msgEl);
    });
    msgContainer.scrollTop = msgContainer.scrollHeight;
};


const limitMessagesInDOM = (container: HTMLElement) => {
    const messageElements = container.querySelectorAll('div:not(#chatPlaceholder)');

    if (messageElements.length > MAX_MESSAGES) {
        const firstMessage = messageElements[0];
        if (firstMessage) {
            firstMessage.remove();
        }
    }
};


const handleUserStatusChanged = (data: any) => {
};

const handleOnlineUsers = (data: any) => {
};

const handleChatMessage = (data: any) => {
  const chatPanel = document.getElementById("chatPanel") as HTMLElement;
  const userId = localStorage.getItem("userId");
  const userIdPlaceholder = userId ? parseInt(userId, 10) : null;
  
  if (!userIdPlaceholder) return;

  const messagesContainer = document.getElementById('messagesContainer');
  const chatHeader = chatPanel.querySelector('.font-bold');

  if (!messagesContainer || !chatHeader) return;
  
  const senderId = data.senderId ? parseInt(String(data.senderId), 10) : null;
  const currentFriendName = chatHeader.textContent; 

  if (data.senderName === currentFriendName) {
      const msgDiv = document.createElement('div');
      msgDiv.className = "bg-gray-200 text-poke-dark p-2 rounded-xl max-w-[80%] mr-auto shadow";
      msgDiv.textContent = data.message;
      messagesContainer.appendChild(msgDiv);
      
      limitMessagesInDOM(messagesContainer);

      messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }
  
  if (senderId && userIdPlaceholder) {
      saveMessage(senderId, userIdPlaceholder, data.message, false);
  }
};


export function cleanupChatView() {
  wsService.off('user-status-changed', handleUserStatusChanged);
  wsService.off('online-users', handleOnlineUsers);
  wsService.off('chat-friends', handleChatMessage);
}

export function ChatView(app: HTMLElement, state: any) {
  
  cleanupChatView(); 

  const userId = localStorage.getItem("userId");
  const userIdPlaceholder = userId ? parseInt(userId, 10) : null;

  app.innerHTML = `
    <div class="flex flex-col bg-poke-light bg-opacity-60 text-poke-dark border-3 border-poke-dark p-4 rounded-2xl shadow-lg max-w-6xl mx-auto" style="height: 85vh;">
      
      <div id="chatRowContainer" class="flex flex-1 space-x-4 mb-4"> 
          
          <div id="friendsListPanel" class="w-1/3 bg-white bg-opacity-60 border-r-2 border-poke-dark rounded-lg p-3 overflow-y-auto h-full">
            <h2 class="text-lg font-bold text-center mb-2">${t("friends_list")}</h2>
            <div id="friendsListContainer" class="space-y-2"></div>
          </div>

          <div id="chatPanel" class="flex-1 flex flex-col bg-white bg-opacity-40 border-2 border-poke-dark rounded-lg p-4 h-full">
            <div class="flex-1 flex flex-col items-center justify-center text-center text-poke-dark opacity-70" id="chatPlaceholder">
              ${t("select_friend_chat") || "Selecciona un amigo para chatear"}
            </div>
          </div>
          
      </div> 
      
      <div class="flex justify-center mt-auto">
          <button id="goBackBtn" class="bg-poke-red bg-opacity-80 text-poke-light py-2 border-3 border-poke-red border-b-red-800 rounded hover:bg-gradient-to-b hover:from-red-500 hover:to-red-600 active:animate-press active:border-b-red-800">
            ${t("goBack")}
          </button> 
      </div>
      
    </div>
  `;

  document.getElementById("goBackBtn")?.addEventListener("click", () => {
      cleanupChatView();
      navigate("/");
  });

  const listContainer = document.getElementById("friendsListContainer") as HTMLElement;
  const chatPanel = document.getElementById("chatPanel") as HTMLElement;

  const loadFriends = async () => {
    const token = localStorage.getItem("tokenUser");
    const userId = localStorage.getItem("userId");
    const userIdNum = userId ? parseInt(userId, 10) : null;

    if (!token || !userIdNum) {
      listContainer.innerHTML = `<p class="text-sm text-red-600">${t("error_no_login")}</p>`;
      return;
    }

    try {
      const response = await fetch(`${API_ENDPOINTS.FRIENDS}?id=${userIdNum}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      const friends = Array.isArray(data.success) ? data.success : [];

      if (friends.length === 0) {
        listContainer.innerHTML = `<p class="text-center text-gray-600">${t("no_friends_yet")}</p>`;
        return;
      }

      await renderFriendsList(friends);
    } catch (err) {
      console.error(err);
      listContainer.innerHTML = `<p class="text-red-500">${t("error_network")}</p>`;
    }
  };
  
  const renderFriendsList = async (friends: any[]) => {
    const token = localStorage.getItem("tokenUser");
    
    const friendsWithAvatars = await Promise.all(
      friends.map(async (f: any) => {
        const friendId = f.id || f.user_id;
        const avatarUrl = await fetchAvatarUrl(friendId, token || '');
        const avatarSrc = avatarUrl || "/assets/avatar_39.png";
        
        return {
          ...f,
          avatar_src: avatarSrc
        };
      })
    );
    
    listContainer.innerHTML = friendsWithAvatars
      .map((f: any) => {
        const friendId = f.id || f.user_id;
        const status = wsService.getUserStatus(String(friendId)) || 'offline';
        const statusColor = status === 'online' ? 'bg-green-500' : 
                           status === 'in-game' ? 'bg-yellow-500' : 'bg-gray-400';
        const statusText = status === 'online' ? 'Online' : 
                          status === 'in-game' ? 'In Game' : 'Offline';
        
        return `
        <div class="friend-item flex items-center gap-3 p-2 bg-white bg-opacity-70 rounded cursor-pointer hover:bg-poke-blue hover:text-white transition"
             data-id="${friendId}" data-username="${f.username}">
          <div class="relative">
            <img src="${f.avatar_src}" class="w-8 h-8 rounded-full object-cover" />
            <div class="absolute -bottom-1 -right-1 w-3 h-3 ${statusColor} rounded-full border-2 border-white" 
                 title="${status}"></div>
          </div>
          <div class="flex-1">
            <span class="font-medium">${f.username}</span>
            <span class="text-xs ml-2 opacity-70">${statusText}</span>
          </div>
        </div>
      `;
      })
      .join("");
  };


  const openChat = (friendId: number, friendName: string) => {
    chatPanel.innerHTML = `
      <div class="flex flex-col w-full h-full">
        <div class="border-b border-poke-dark pb-2 mb-2 font-bold">${friendName}</div>

        <div id="messagesContainer" class="flex-1 overflow-y-auto space-y-2 text-left pr-2 bg-white bg-opacity-40 border border-poke-dark rounded p-3 h-0">
          <div class="text-center text-sm text-poke-dark opacity-70" id="chatPlaceholder">${t("chat_welcome")} ${state.player.alias || t("player")}!</div>
        </div>

        <div class="mt-3 flex gap-2">
          <input id="chatInput" type="text" placeholder="${t("type_message")}" class="flex-1 border-2 border-poke-dark px-3 py-2 rounded focus:outline-none" />
          <button id="sendMsgBtn" class="bg-poke-blue text-white px-4 py-2 rounded">${t("send")}</button>
        </div>
      </div>
    `;

    const msgContainer = document.getElementById("messagesContainer")!;
    const msgInput = document.getElementById("chatInput") as HTMLInputElement;
    const sendBtn = document.getElementById("sendMsgBtn")!;

    const currentUserId = userIdPlaceholder!;
    const chatKey = getChatKey(currentUserId, friendId);
    const savedHistoryJson = localStorage.getItem(chatKey);
    const savedHistory = savedHistoryJson ? JSON.parse(savedHistoryJson) : [];
    
    if (savedHistory.length > 0) {
        const placeholder = document.getElementById('chatPlaceholder');
        if (placeholder) placeholder.remove();
    }
    
    renderHistory(savedHistory, msgContainer);

    const sendMessage = () => {
      const text = msgInput.value.trim();
      if (!text) return;
      
      const placeholder = document.getElementById('chatPlaceholder');
      if (placeholder) placeholder.remove();
      
      const msgEl = document.createElement("div");
      msgEl.className = "bg-poke-blue text-white p-2 rounded-xl max-w-[80%] ml-auto shadow";
      msgEl.textContent = text;
      msgContainer.appendChild(msgEl);
      msgInput.value = "";
      
      limitMessagesInDOM(msgContainer);

      msgContainer.scrollTop = msgContainer.scrollHeight;
      
      saveMessage(currentUserId, friendId, text, true); 

      const userId = localStorage.getItem('userId');
      if (!userId) {
        console.error('No userId found');
        return;
      }
      
      const success = wsService.send({
        type: 'chat-friends',
        userId: userId,
        receiverId: String(friendId),
        message: text
      });
      
      if (!success) {
        console.error('Failed to send message via WebSocket');
      }
    };

    sendBtn.addEventListener("click", sendMessage);
    msgInput.addEventListener("keypress", (e) => e.key === "Enter" && sendMessage());
  };

  listContainer.addEventListener("click", (e) => {
    const item = (e.target as HTMLElement).closest(".friend-item") as HTMLElement;
    if (!item) return;
    const id = parseInt(item.dataset.id!, 10);
    const name = item.dataset.username!;
    openChat(id, name);
  });

  loadFriends();
  
  wsService.getOnlineUsers();
  
  wsService.on('user-status-changed', handleUserStatusChanged);
  wsService.on('online-users', handleOnlineUsers);
  wsService.on('chat-friends', handleChatMessage);
}