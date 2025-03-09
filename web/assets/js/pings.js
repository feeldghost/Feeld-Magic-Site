document.addEventListener("DOMContentLoaded", function() {
    document.getElementById("sexuality").value = capitalizeFirstLetterWithSpaces(document.getElementById("sexuality").value)
    document.getElementById("gender").value = capitalizeFirstLetterWithSpaces(document.getElementById("gender").value)

    addBioChangeEvent()
});

var totalPingsEle = 0

function loadPings(data) {
    var likedBy = data["data"]["interactions"]["nodes"];
    var userGrid = document.getElementById("pingsUserGrid");

    notify("Feeld current loads your pings in batches so if you've got quite a few pings 20+ they may not all load, just like/dislike your current batch and refresh the page")

    var totalPings = document.getElementById("totalPings")

    totalPingsEle = data["data"]["interactions"]["pageInfo"]["total"]

    totalPings.textContent = `${data["data"]["interactions"]["pageInfo"]["total"].toLocaleString()} Total Pings`;

    userGrid.innerHTML = "";

    likedBy.forEach(user => {
        var { age, gender, sexuality, imaginaryName, interactionStatus, photos, distance, id, lastSeen } = user;
        var userSection = document.createElement("div");
        userSection.classList.add("likes-user-card");
        userSection.setAttribute("data-id", id);

        var baseInformation = `<h2 class="cleanText">${imaginaryName || "Unknown"}</h2>`

        if (lastSeen) {
            baseInformation = baseInformation + `
                <p class="cleanText">${formatLastSeenTimestamp(lastSeen)}</p>
            `
        }

        userSection.innerHTML = `${baseInformation}
        <p class="cleanText">${age || "Unknown"} ${capitalizeFirstLetterWithSpaces(gender.toLowerCase().replaceAll("_", " ").replaceAll("-", "")) || "Unknown"} ${capitalizeFirstLetterWithSpaces(sexuality.toLowerCase().replaceAll("_", " ").replaceAll("-", "")) || "Unknown"}</p>
        <p class="cleanText">${distance?.mi ?? "Unknown"} mi away</p>
        <p class="cleanText">${interactionStatus.message || "N/A"}</p>
        `;

        if (photos && photos.length > 0) {
            let currentIndex = 0;

            var photoContainer = document.createElement("div");
            photoContainer.style.position = "relative";
            photoContainer.style.textAlign = "center";

            var img = document.createElement("img");
            img.src = photos[currentIndex].pictureUrl;
            img.classList.add("likes-user-photo");
            img.style.maxWidth = "100%";
            img.style.borderRadius = "10px";
            photoContainer.appendChild(img);

            var backButton = document.createElement("button");
            backButton.textContent = "<";
            backButton.style.position = "absolute";
            backButton.style.left = "10px";
            backButton.style.top = "50%";
            backButton.style.transform = "translateY(-50%)";
            backButton.style.padding = "10px";
            backButton.style.background = "#42454a";
            backButton.style.color = "#fff";
            backButton.style.border = "none";
            backButton.style.cursor = "pointer";
            backButton.style.borderRadius = "5px";

            var nextButton = document.createElement("button");
            nextButton.textContent = ">";
            nextButton.style.position = "absolute";
            nextButton.style.right = "10px";
            nextButton.style.top = "50%";
            nextButton.style.transform = "translateY(-50%)";
            nextButton.style.padding = "10px";
            nextButton.style.background = "#42454a";
            nextButton.style.color = "#fff";
            nextButton.style.border = "none";
            nextButton.style.cursor = "pointer";
            nextButton.style.borderRadius = "5px";

            backButton.addEventListener("click", () => {
                if (currentIndex > 0) {
                    currentIndex--;
                    img.src = photos[currentIndex].pictureUrl;
                }
            });

            nextButton.addEventListener("click", () => {
                if (currentIndex < photos.length - 1) {
                    currentIndex++;
                    img.src = photos[currentIndex].pictureUrl;
                }
            });

            photoContainer.appendChild(backButton);
            photoContainer.appendChild(nextButton);

            userSection.appendChild(photoContainer);

            var actionButtons = document.createElement("div");
            actionButtons.style.display = "flex";
            actionButtons.style.justifyContent = "space-between";
            actionButtons.style.marginTop = "10px";

            var plusButton = document.createElement("button");
            plusButton.textContent = "+";
            plusButton.setAttribute("alt", id);
            plusButton.style.padding = "8px 16px";
            plusButton.style.background = "#9370DB";
            plusButton.style.color = "#fff";
            plusButton.style.border = "none";
            plusButton.style.cursor = "pointer";
            plusButton.style.borderRadius = "5px";
            plusButton.style.fontSize = "14px";
            plusButton.onclick = () => acceptPing(id, imaginaryName);

            var minusButton = document.createElement("button");
            minusButton.textContent = "-";
            minusButton.setAttribute("alt", id);
            minusButton.style.padding = "8px 16px";
            minusButton.style.background = "#9370DB";
            minusButton.style.color = "#fff";
            minusButton.style.border = "none";
            minusButton.style.cursor = "pointer";
            minusButton.style.borderRadius = "5px";
            minusButton.style.fontSize = "14px";
            minusButton.onclick = () => rejectPing(id, imaginaryName);

            actionButtons.appendChild(plusButton);
            actionButtons.appendChild(minusButton);

            userSection.appendChild(actionButtons);
        } else {
            userSection.innerHTML += `<p class="cleanText">No photos (this should never happen)</p>`;
        }

        userGrid.appendChild(userSection);
    });
}

function removeFromPingCard(profileId) {
    var likedUserCard = document.querySelector(`.likes-user-card[data-id="${profileId}"]`);

    if (likedUserCard) {
        likedUserCard.remove();
        totalPingsEle = totalPingsEle -1;

        var totalLikesElement = document.getElementById("totalPings");
        totalLikesElement.textContent = `${(totalPingsEle).toLocaleString()} Total Pings`;
    }
}

async function acceptPing(profileId, displayName) {
    var response = await backendRequest("/feeldRequest", {
        "operationName": "ProfileLike",
        "query": "mutation ProfileLike($targetProfileId: String!) {\n  profileLike(input: {targetProfileId: $targetProfileId}) {\n    status\n    chat {\n      ...ChatListItemChatFragment\n      __typename\n    }\n    __typename\n  }\n}\n\nfragment ChatListItemChatFragment on Chat {\n  ...ChatFragment\n  __typename\n}\n\nfragment ChatFragment on Chat {\n  id\n  name\n  type\n  streamChatId\n  status\n  members {\n    ...ChatMemberFragment\n    __typename\n  }\n  disconnectedMembers {\n    ...ChatMemberFragment\n    __typename\n  }\n  __typename\n}\n\nfragment ChatMemberFragment on Profile {\n  id\n  status\n  analyticsId\n  imaginaryName\n  streamUserId\n  age\n  dateOfBirth\n  sexuality\n  isIncognito\n  ...ProfileInteractionStatusFragment\n  gender\n  photos {\n    ...GetPictureUrlFragment\n    pictureType\n    __typename\n  }\n  ...AnalyticsProfileFragment\n  __typename\n}\n\nfragment ProfileInteractionStatusFragment on Profile {\n  interactionStatus {\n    message\n    mine\n    theirs\n    __typename\n  }\n  __typename\n}\n\nfragment GetPictureUrlFragment on Picture {\n  id\n  publicId\n  pictureIsSafe\n  pictureIsPrivate\n  pictureUrl\n  __typename\n}\n\nfragment AnalyticsProfileFragment on Profile {\n  id\n  isUplift\n  lastSeen\n  age\n  gender\n  sexuality\n  verificationStatus\n  distance {\n    km\n    mi\n    __typename\n  }\n  profilePairs {\n    identityId\n    __typename\n  }\n  __typename\n}",
        "variables": {
            "targetProfileId": profileId
        }
    })

    if (!response) {
        notify(`Failed to accept ping from ${displayName}`)
        return
    }

    if (response.data.profileLike) {
        if (response.data.profileLike.status == "RECIPROCATED") {
            notify(`Successfully matched with ${displayName}`)

            removeFromPingCard(profileId)
        }
    } else {
        if (response.errors) {
            notify(`Failed to like/match ${displayName} - ${response.errors[0].message}`)
        } else {
            notify(`Failed to like/match ${displayName} - Unknown reason`)
        }
    }
}

async function rejectPing(profileId, displayName) {
    var response = await backendRequest("/feeldRequest", {
        "operationName": "ProfileDislike",
        "query": "mutation ProfileDislike($targetProfileId: String!) {\n  profileDislike(input: {targetProfileId: $targetProfileId})\n}",
        "variables": {
            "targetProfileId": profileId
        }
    })

    if (!response) {
        notify(`Failed to reject ping from ${displayName}`)
        return
    }

    if (response.data.profileDislike) {
        if (response.data.profileDislike == "SENT") {
            notify(`Successfully rejected ping from ${displayName}`)

            removeFromPingCard(profileId)
        }
    } else {
        if (response.errors) {
            notify(`Failed to reject ping from ${displayName} - ${response.errors[0].message}`)
        } else {
            notify(`Failed to reject ping from ${displayName} - Unknown reason`)
        }
    }
}