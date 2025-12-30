import { navigate } from "../main.js";
import { t } from "../translations/index.js";
import { ChatView } from "./Chat.js";
import { API_ENDPOINTS, apiFetch } from "../config/api.js";
import { fetchAvatarUrl } from "./Header.js";
import { wsService } from "../services/WebSocketService.js";


export async function FriendsView(app: HTMLElement, state: any): Promise<void> {
    app.innerHTML = `
        <div class="flex justify-center gap-6 max-w-6xl mx-auto">
        <!-- Columna izquierda: amigos -->
        <div id="friendsSection" class="flex-1 bg-poke-light bg-opacity-60 text-poke-dark border-3 border-poke-dark p-8 rounded-2xl shadow-lg flex flex-col items-center text-center space-y-4 max-w-3xl">
            <h1 class="text-xl font-bold mb-4">${t("friends_center")}</h1>
    
            <div class="flex flex-wrap justify-around w-full mb-6 gap-3">
                <button id="friendsListBtn" class="tab-btn bg-poke-blue text-poke-light border-3 border-poke-blue border-b-blue-800 rounded px-4 py-2 hover:bg-gradient-to-b hover:from-blue-500 hover:to-blue-600 active:animate-press">
                    ${t("friends_list")}
                </button>
                <button id="addFriendBtn" class="tab-btn bg-poke-red text-poke-light border-3 border-poke-red border-b-red-800 rounded px-4 py-2 hover:bg-gradient-to-b hover:from-red-500 hover:to-red-600 active:animate-press">
                    ${t("add_friend")}
                </button>
                <button id="requestsBtn" class="tab-btn bg-poke-blue text-poke-light border-3 border-poke-blue border-b-blue-800 rounded px-4 py-2 hover:bg-gradient-to-b hover:from-blue-500 hover:to-blue-600 active:animate-press">
                    ${t("requests")}
                </button>
            </div>
    
            <div id="friendsContentOuter" class="w-full bg-white bg-opacity-40 border-2 border-poke-dark rounded-lg p-4 overflow-hidden" style="height: 400px;">
                <div id="friendsContent" class="w-full h-full overflow-y-auto pr-2 space-y-2"></div>
            </div>
    
            <button id="backBtn" class="bg-poke-red bg-opacity-80 text-poke-light py-2 mt-6 border-3 border-poke-red border-b-red-800 rounded hover:bg-gradient-to-b hover:from-red-500 hover:to-red-600 active:animate-press">
                ${t("goBack")}
            </button>
        </div>
    
        <!-- Columna derecha: chat -->
        <div id="chatSection" class="flex-1 hidden">
        </div>
        </div>
    `;
  
    const userId = localStorage.getItem('userId'); 
    const userIdPlaceholder = userId ? parseInt(userId, 10) : null;

    const content = document.getElementById("friendsContent") as HTMLElement;

    const getRelatedUserIds = async (token: string, currentUserId: number): Promise<number[]> => {
        let relatedIds: Set<number> = new Set();
        
        try {
            const friendsResponse = await apiFetch(`${API_ENDPOINTS.FRIENDS}?id=${currentUserId}`, {
                method: 'GET',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const friendsData = await friendsResponse.json();
            const friends = Array.isArray(friendsData.success) ? friendsData.success : [];
            friends.forEach((f: any) => relatedIds.add(f.id || f.user_id));

            const requestsRecievedResponse = await apiFetch(`${API_ENDPOINTS.FRIEND_REQUEST}?id=${currentUserId}`, {
                method: 'GET',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const requestsRecievedData = await requestsRecievedResponse.json();
            const receivedRequests = Array.isArray(requestsRecievedData.success) ? requestsRecievedData.success : [];
            receivedRequests.forEach((r: any) => relatedIds.add(r.sender_id));
            
        } catch (error) {
            console.error("Error fetching related IDs:", error);
        }
        
        if (currentUserId) relatedIds.add(currentUserId);
        
        return Array.from(relatedIds) as number[];
    };

    const fetchFriendList = async (): Promise<string> => {
        const token = localStorage.getItem('tokenUser');
        if (!token) {
            return `<p class="text-red-500">${t("error_no_login") || "Error: No se ha iniciado sesión."}</p>`;
        }
        const userId = localStorage.getItem('userId');
        const userIdPlaceholder = userId ? parseInt(userId, 10) : null;
            
    
        try {
            const response = await apiFetch(`${API_ENDPOINTS.FRIENDS}?id=${userIdPlaceholder}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                }
            });
    
            const data = await response.json();
    
            const friends = Array.isArray(data.success) ? data.success : [];
    
            if (friends.length === 0) {
                return `
                    <h2 class="text-lg mb-3">${t("friends_list")}</h2>
                    <p class="mt-4 text-center text-poke-dark">${t("no_friends_yet") || "Aún no tienes amigos. ¡Añade algunos!"}</p>
                `;
            }

            const friendsWithAvatars = await Promise.all(
                friends.map(async (friend: any) => {
                    const friendId = friend.id || friend.user_id;
                    
                    const avatarUrl = await fetchAvatarUrl(friendId, token);
                    
                    const avatarSrc = avatarUrl || "/assets/avatar_39.png";
                    
                    const status = wsService.getUserStatus(String(friendId)) || 'offline';
                    const statusText = status === 'online' ? 'Online' : 
                                      status === 'in-game' ? 'In Game' : 'Offline';
                    const statusColor = status === 'online' ? 'text-green-600' : 
                                       status === 'in-game' ? 'text-yellow-600' : 'text-gray-500';
                    
                    return { 
                        ...friend, 
                        avatar_src: avatarSrc,
                        status_text: statusText,
                        status_color: statusColor
                    };
                })
            );
    
            return `
                <h2 class="text-lg mb-3">${t("friends_list")}</h2>
                <ul class="space-y-2">
                    ${friendsWithAvatars.map((friend: any) => {
                        const idAmigo = friend.id || friend.user_id; 
                        
                        return `
                        <li class="flex items-center justify-between bg-white bg-opacity-70 p-3 rounded border border-poke-dark">
                            <div class="flex items-center gap-3">
                                <img src="${friend.avatar_src}" class="w-10 h-10 rounded-full object-cover" />
                                <div class="text-left">
                                    <div class="text-sm font-medium">${friend.username}</div>
                                    <div class="text-xs ${friend.status_color}">${friend.status_text}</div>
                                </div>
                            </div>
                            <div class="flex gap-2">
                                <button 
                                    id="msg-${idAmigo}" 
                                    class="msg-btn px-3 py-1 bg-poke-blue bg-opacity-80 text-poke-light rounded border-2 border-poke-blue active:animate-press"
                                    data-friend-id="${idAmigo}"> 
                                    ${t("message")}
                                </button>
                                <button 
                                    data-friend-id="${idAmigo}" 
                                    class="remove-friend-btn px-3 py-1 bg-poke-red bg-opacity-80 text-poke-light rounded border-2 border-poke-red active:animate-press">
                                    ${t("remove")}
                                </button>
                            </div>
                        </li>
                    `;
                    }).join('')}
                </ul>
            `;
    
        } catch (error) {
            console.error("Error fetching friend list:", error);
            return `<p class="text-red-500">${t("error_network") || "Error de red."}</p>`;
        }
    };
    
    

    const setupListListeners = (container: HTMLElement) => {
        container.querySelectorAll('.msg-btn').forEach(btn => {
            btn.addEventListener("click", (e) => {
                
                const targetButton = e.currentTarget as HTMLButtonElement;
                const friendId = targetButton.getAttribute('data-friend-id');
                
                if (friendId) {
                    navigate("/chat");
                } else {
                    console.error("ERROR: No se pudo obtener el ID del amigo para el chat.");
                }
            });
        });
        

        container.querySelectorAll('.remove-friend-btn').forEach(btn => {
            btn.addEventListener("click", async (e) => {
                const targetButton = e.currentTarget as HTMLButtonElement; 
                const friendId = targetButton.dataset.friendId;
                

                if (!friendId || friendId.trim() === "") {
                    console.error("ERROR: friendId es nulo o vacío. Deteniendo remoción.");
                    alert("No se pudo obtener el ID del amigo a eliminar.");
                    return; 
                }

                if (confirm(t("confirm_remove_friend") || `¿Estás seguro de que quieres eliminar al amigo con ID ${friendId}?`)) {
                    const token = localStorage.getItem('tokenUser');
                    
                    try {
                        const response = await apiFetch(`${API_ENDPOINTS.FRIENDS}`, {
                            method: 'POST',
                            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                            body: JSON.stringify({ user_id: userIdPlaceholder, friend_id: friendId })
                        });
                        
                        const data = await response.json();
                        
                        if (response.ok) {
                            alert(data.message || `Amigo eliminado correctamente.`);
            
                            const listHtml = await fetchFriendList();
                            container.innerHTML = listHtml;
                            setupListListeners(container);
                        } else {
                            alert(data.message || `Error al hacer remove`);
                        }

                    } catch (error) {
                        alert(t("error_network_remove") || "Error de red al intentar eliminar.");
                    }
                }
            });
        });
    };

    const requestsList = async (): Promise<string> => {
    const token = localStorage.getItem('tokenUser');
    
    if (!token) return `<p class="text-red-500">${t("error_no_login")}</p>`;

    try {
        const url = `${API_ENDPOINTS.FRIEND_REQUEST}?id=${userIdPlaceholder}`;
        
        const response = await apiFetch(url, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        const data: { success: { sender_id: number; created_at: string }[] } = await response.json();

        if (!response.ok || !Array.isArray(data.success)) {
            console.error('❌ Invalid response format or error:', data);
            return `<p class="text-red-500">Error al cargar solicitudes.</p>`;
        }

        const requests = data.success;

        if (requests.length === 0) {
            return `<p class="mt-4 text-center text-poke-dark">${t("no_request_yet")}</p>`;
        }

        console.log("error");

        const usersInfo = await Promise.all(
            requests.map(async r => {
                const senderId = r.sender_id;
                let username = `User#${senderId}`; 
                
                try {
                    const avatarUrl = await fetchAvatarUrl(senderId, token);
                    const avatarSrc = avatarUrl || '/assets/avatar_39.png'; 
                    
                    const res = await apiFetch(`${API_ENDPOINTS.USER_INFO}?id=${senderId}`, {
                        method: 'GET',
                        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
                    });
                    if (res.ok) {
                        const userData = await res.json();
                        username = userData.success?.username || username;
                    }
                    return {
                        username: username, 
                        
                        avatar_url: avatarSrc 
                    };
                    
                } catch (error) {
                    console.error(`Error fetching info for sender ${senderId}:`, error);
                    return { username: username, avatar_url: '/assets/avatar_39.png' };
                }
            })
        );
        
        return `
            <h2 class="text-lg mb-3">${t("request_list")}</h2>
            <ul class="space-y-2">
                ${requests.map((r, i) => 
                    `
                    <li class="flex items-center justify-between bg-white bg-opacity-70 p-3 rounded border border-poke-dark">
                        <div class="flex items-center gap-3">
                            <img src="${usersInfo[i].avatar_url}" class="w-10 h-10 rounded-full" />
                            <div class="text-left">
                                <div class="text-sm font-medium">${usersInfo[i].username}</div>
                                <div class="text-sm text-poke-dark">${new Date(r.created_at).toLocaleDateString()}</div>
                            </div>
                        </div>
                        <div class="flex gap-2">
                            <button class="accept-btn px-3 py-1 bg-poke-blue bg-opacity-80 text-poke-light rounded" data-sender-id="${r.sender_id}">
                                ${t("accept")}
                            </button>
                            <button class="decline-btn px-3 py-1 bg-poke-red bg-opacity-80 text-poke-light rounded" data-sender-id="${r.sender_id}">
                                ${t("decline")}
                            </button>
                        </div>
                    </li>
                `).join('')}
            </ul>
        `;

    } catch (err) {
        console.error(err);
        return `<p class="text-red-500">${t("error_network")}</p>`;
    }
};


    const setupRequestListeners = (container: HTMLElement) => {
        const token = localStorage.getItem('tokenUser');
        if (!token) return;
    
        const handleAction = async (senderId: number, action: 'accept' | 'decline') => {
            try {
                const response = await apiFetch(`${API_ENDPOINTS.FRIEND_REQUEST}`, {
                    method: 'PATCH',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        sender_id: senderId,
                        receiver_id: userIdPlaceholder,
                        action
                    })
                });
    
                const text = await response.text(); 
                let data;
                try { data = JSON.parse(text); } catch {
                    console.error(`Respuesta inesperada del servidor al ${action}:`, text);
                    alert("Error al procesar la solicitud: " + text);
                    return;
                }
    
                if (response.ok) {
                    alert(data.message || `Solicitud ${action}ada`);
    
                    const reqHtml = await requestsList();
                    container.innerHTML = reqHtml;
                    setupRequestListeners(container);
    
                    if (document.getElementById("friendsContent")?.dataset.tab === "list") {
                        const listHtml = await fetchFriendList();
                        container.innerHTML = listHtml;
                        setupListListeners(container);
                    }
                } else {
                    alert(data.message || `Error al ${action} la solicitud`);
                }
    
            } catch (err) {
                console.error(`Error de red al ${action} solicitud:`, err);
                alert(`Error de red al ${action} la solicitud`);
            }
        };
    
        container.querySelectorAll<HTMLButtonElement>('.accept-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const senderId = parseInt(btn.dataset.senderId!);
                if (!senderId) return;
                handleAction(senderId, 'accept');
            });
        });
    
        container.querySelectorAll<HTMLButtonElement>('.decline-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const senderId = parseInt(btn.dataset.senderId!);
                if (!senderId) return;
                handleAction(senderId, 'decline');
            });
        });
    };

    const sections = {
        list: `
            <div class="text-center p-8">
                <p>${t("loading_friends") || "Cargando amigos..."}</p>
                <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-poke-blue mx-auto mt-4"></div>
            </div>
        `,
        add: `
            <h2 class="text-lg mb-3">${t("add_friend")}</h2>
            <div class="flex items-center gap-3">
                <input id="friendName" type="text" placeholder="${t("enter_friend_name")}" class="border-2 border-poke-dark px-4 py-2 rounded flex-1"/>
                <button id="sendReqBtn" class="ml-2 bg-poke-blue text-poke-light px-4 py-2 border-3 border-poke-blue border-b-blue-800 rounded hover:bg-gradient-to-b hover:from-blue-500 hover:to-blue-600">
                    ${t("send_request")}
                </button>
            </div>
            <p class="mt-4 text-sm text-poke-dark">${t("add_friend_hint")}</p>
        `,
        requests: `
            <h2 class="text-lg mb-3">${t("requests")}</h2>
            <div class="space-y-3">
                <div class="p-3 rounded border border-poke-dark bg-white bg-opacity-80 flex justify-between items-center">
                    <div>
                        <div class="font-medium">IncomingUser1</div>
                        <div class="text-xs text-poke-dark">Wants to be your friend</div>
                    </div>
                    <div class="flex gap-2">
                        <button class="px-3 py-1 bg-poke-blue text-poke-light rounded">${t("accept")}</button>
                        <button class="px-3 py-1 bg-poke-red text-poke-light rounded">${t("decline")}</button>
                    </div>
                </div>
                <p class="text-sm text-poke-dark">${t("no_more_requests")}</p>
            </div>
        `
    };

    const switchTab = async (tab: keyof typeof sections) => {
      const inner = content;
      inner.style.opacity = '0';
      
      if (tab === "list") {
          inner.innerHTML = sections.list;
          
          const listHtml = await fetchFriendList(); 
          
          setTimeout(() => {
              inner.innerHTML = listHtml; 
              inner.style.opacity = '1';
              setupListListeners(inner); 
          }, 120);
          return;
      }

      if (tab === "requests") {
        inner.innerHTML = `
          <div class="text-center p-8">
            <p>${t("loading_requests") || "Cargando solicitudes..."}</p>
            <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-poke-blue mx-auto mt-4"></div>
          </div>
        `;
    
        const reqHtml = await requestsList();
    
        setTimeout(() => {
            inner.innerHTML = reqHtml;
            inner.style.opacity = '1';
    
            setupRequestListeners(inner);
        }, 120);
    
        return;
    }    

      setTimeout(() => {
          inner.innerHTML = sections[tab];
          inner.style.opacity = '1';
  
          if (tab === "add") {
              const sendReqBtn = document.getElementById("sendReqBtn");
              const r_id_Input = document.getElementById("friendName") as HTMLInputElement;
              if (sendReqBtn) {
                  sendReqBtn.addEventListener("click", async () => {
                      const nameInput = document.getElementById("friendName") as HTMLInputElement | null;
                      if (!nameInput || !nameInput.value.trim()) return;
                      
                      const token = localStorage.getItem('tokenUser');
                      const username = r_id_Input.value.trim();
                      
                     try {
                        const getUserResponse = await apiFetch(`${API_ENDPOINTS.GET_USER_ID}?user=${username}`, {
                            method: 'GET',
                            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
                        });

                        if (!getUserResponse.ok) {
                            alert(`Usuario "${username}" no encontrado.`);
                            return;
                        }

                        const userData = await getUserResponse.json();
                        const receiverId = userData.success?.user_id;

                        if (!receiverId) {
                            alert('Error: No se pudo obtener el ID del usuario.');
                            return;
                        }
                        const relatedIds = await getRelatedUserIds(token!, userIdPlaceholder!);
                        
                        if (relatedIds.includes(receiverId)) {
                            if (receiverId === userIdPlaceholder) {
                                alert('No puedes enviarte una solicitud a ti mismo.');
                            } else {
                                alert('Ya tienes una relación de amistad o una solicitud pendiente con este usuario.');
                            }
                            nameInput.value = "";
                            return;
                        }
                        
                        const sendRequestResponse = await apiFetch(`${API_ENDPOINTS.FRIEND_REQUEST}`, {
                            method: 'POST',
                            headers: {
                                'Authorization': `Bearer ${token}`,
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify({ 
                                sender_id: userIdPlaceholder, 
                                receiver_id: receiverId 
                            })
                        });

                        if (!sendRequestResponse.ok) {
                            const errorData = await sendRequestResponse.json();
                            alert(errorData.message || "Error al enviar solicitud de amistad");
                            return;
                        }

                        alert(`✅ Solicitud enviada a ${username}`);
                        nameInput.value = "";
                        
                     } catch (err) {
                        console.error(err);
                        alert("Error de conexión con el servidor");
                      }
                  });
              }
          }
      }, 120);
  };
  
 
    window.addEventListener('load', () => switchTab("list")); 

    document.getElementById("friendsListBtn")?.addEventListener("click", () => switchTab("list"));
    document.getElementById("addFriendBtn")?.addEventListener("click", () => switchTab("add"));
    document.getElementById("requestsBtn")?.addEventListener("click", () => switchTab("requests"));
    document.getElementById("backBtn")?.addEventListener("click", () => navigate("/"));
    
    switchTab("list");
}