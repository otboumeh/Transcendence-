import { navigate } from "../main.js";
import { API_ENDPOINTS } from "../config/api.js";
import { t } from "../translations/index.js";


export async function fetchAvatarUrl(userId: number | null, token: string | null): Promise<string | null> {
    if (!userId || !token) return null;

    try {
        const avatarInfoResponse = await fetch(`${API_ENDPOINTS.AVATAR_PHOTO}?user_id=${userId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (avatarInfoResponse.ok) {
            const avatarData = await avatarInfoResponse.json();
            const avatarUrl = avatarData.success?.avatar_url;
            
            
            if (avatarUrl) {
                if (avatarUrl.startsWith('/uploads/')) {
                    const fullUrl = `${window.location.protocol}//${window.location.host}${avatarUrl}`;
                    return fullUrl;
                }
                return avatarUrl;
            }
        } else {
            console.error('❌ Avatar API response not OK:', avatarInfoResponse.status);
        }

        const response = await fetch(`${API_ENDPOINTS.USERS}?id=${userId}`, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });

        if (!response.ok) {
            console.error("Error fetching avatar:", response.status);
            return null; 
        }

        const imageBlob = await response.blob();
        
        if (imageBlob.type.includes('application/json')) {
             const jsonText = await imageBlob.text();
             console.error("El servidor envió un error JSON en lugar de la imagen:", jsonText);
             return null;
        }

        const imageObjectURL = URL.createObjectURL(imageBlob);
        
        return imageObjectURL;
        
    } catch (error) {
        console.error("Error fetching avatar:", error);
        return null;
    }
}



export function updateHeader(state: any): void {
    const header = document.querySelector("header");
    if (!header) return;

    const token = localStorage.getItem("tokenUser");
    const userId = localStorage.getItem('userId');
    const userIdPlaceholder = userId ? parseInt(userId, 10) : null;

    fetchAvatarUrl(userIdPlaceholder, token).then((avatarUrl) => {

        let avatarSrc = avatarUrl || "/assets/avatar_39.png"; 

        header.innerHTML = `
      <div class="relative flex items-center justify-center">
        <p class="text-lg font-bold">PONG</p>
        ${
          avatarSrc
            ? `<div class="absolute right-4 flex items-center space-x-2">
                  <img src="${avatarSrc}"
                       id="avBtn"
                       alt="avatar"
                       class="w-10 h-10 rounded-full cursor-pointer hover:opacity-80"/>
                  <img src="/assets/settings.png"
                       id="settingsBtn"
                       alt="settings"
                       class="w-10 h-10 rounded-full cursor-pointer hover:opacity-80"/>
               </div>`
            : ""
        }
      </div>
    `;

    const settingsBtn = document.getElementById("settingsBtn");
    const avBtn = document.getElementById("avBtn");

    if (settingsBtn) settingsBtn.addEventListener("click", () => navigate("/settings"));
    if (avBtn) avBtn.addEventListener("click", () => navigate("/menu"));
  });
}
