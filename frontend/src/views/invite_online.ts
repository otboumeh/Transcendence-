import { t } from "../translations/index.js";
import { API_ENDPOINTS, apiFetch } from "../config/api.js";
import { fetchAvatarUrl } from "./Header.js";
import { wsService } from "../services/WebSocketService.js";
import { navigate } from "../main.js";

type Friend = {
    id?: number;
    user_id?: number;
    username: string;
};

let inGame = false;
let wsListenersRegistered = false;

export default async function loadFriends() {
    if (!wsListenersRegistered) {
        registerWsListeners();
        wsListenersRegistered = true;
    }

    const selfId = localStorage.getItem("userId");
    const token = localStorage.getItem("tokenUser");

    if (!selfId || !token) {
        console.error("Missing user credentials");
        return;
    }

    let content = document.getElementById("friendsContent");
    if (!content) {
        const app = document.getElementById("app");
        if (!app) {
            console.error("App container not found");
            return;
        }

        app.innerHTML = `
            <div class="max-w-3xl mx-auto p-4">
                <h1 class="text-xl font-bold mb-4">${t("Chooseafriend")}</h1>
                <div id="friendsContent" class="h-96 overflow-y-auto bg-white bg-opacity-40 rounded border p-2">
                    <p class="text-center mt-4">${t("loading_friends")}</p>
                </div>
                <button id="backBtn" class="mt-4 px-4 py-2 bg-red-600 text-white rounded">${t("goBack")}</button>
            </div>
        `;
        content = document.getElementById("friendsContent");
        if (!content) {
            console.error("friendsContent could not be created");
            return;
        }
    }

    async function fetchFriends(): Promise<string> {
        try {
            const response = await apiFetch(`${API_ENDPOINTS.FRIENDS}?id=${selfId}`, {
                method: "GET",
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await response.json();
            const friends: Friend[] = Array.isArray(data.success) ? data.success : [];

            if (friends.length === 0) return `<p>${t("no_friends_yet")}</p>`;

            const mapped = await Promise.all(
                friends.map(async (friendData: Friend) => {
                    const uid: number | null = friendData.id ?? friendData.user_id ?? null;
                    return {
                        ...friendData,
                        avatar_src: await fetchAvatarUrl(uid, token) || "/assets/avatar_39.png"
                    };
                })
            );

            return mapped
                .map(friend => `
                    <div class="flex justify-between items-center p-2 bg-white bg-opacity-60 rounded border mb-2">
                        <div class="flex items-center gap-3">
                            <img src="${friend.avatar_src}" class="w-10 h-10 rounded-full">
                            <span>${friend.username}</span>
                        </div>
                        <button data-id="${friend.id ?? friend.user_id}" class="invite-btn bg-blue-600 text-white px-3 py-1 rounded">
                            ${t("invite")}
                        </button>
                    </div>
                `)
                .join("");

        } catch (error) {
            console.error("Error fetching friends:", error);
            return `<p>${t("error_network")}</p>`;
        }
    }

    content.innerHTML = await fetchFriends();

    content.querySelectorAll<HTMLButtonElement>(".invite-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            if (inGame) {
                alert("You already in a game.");
                return;
            }

            const to = btn.dataset.id;
            if (!to) return;

            wsService.send({
                type: "game-invite",
                from: parseInt(selfId, 10),
                to: parseInt(to, 10)
            });
        });
    });

    function registerWsListeners() {
        wsService.on("game-invite-sent", (msg: any) => {
            alert(`Invitation sent to ${msg.to}`);
        });

        wsService.on("game-start", (msg: any) => {
            if (!inGame) {
                inGame = true; 
                navigate("/1v1o");
            }
        });

        wsService.on("game-ended", (msg: any) => {
            if (msg.gameId) { 
                inGame = false;
            }
        });

        wsService.on("game-invite-rejected", () => {
            alert("Your invitation was rejected");
        });

        wsService.on("game-invite", (msg: any) => {
            if (inGame) {
                wsService.send({
                    type: "game-invite-response",
                    inviteId: msg.inviteId,
                    response: false
                });
                return;
            }

            const accept = confirm(`Player ${msg.from} invites you to a game. Accept?`);
            wsService.send({
                type: "game-invite-response",
                inviteId: msg.inviteId,
                response: accept
            });

        });
    }

    const backBtn = document.getElementById("backBtn");
    if (backBtn) {
        backBtn.onclick = () => navigate("/");
    }
}
