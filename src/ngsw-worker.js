self.addEventListener("install", (event) => {
  console.log("Service Worker installing.");
});

self.addEventListener("activate", (event) => {
  console.log("Service Worker activating.");
  event.waitUntil(
    caches
      .open("form-data-cache")
      .then((cache) => {
        console.log("Cache opened during activation:", cache);
      })
      .catch((err) => {
        console.error("Error opening cache during activation:", err);
      })
  );
});

const cacheName = "form-data-cache";

self.addEventListener("message", (event) => {
  console.log("Service Worker received message:", event.data.type);
  if (event.data && event.data.type === "SAVE_FORM_DATA") {
    const formData = event.data.payload;
    console.log("Saving form data to cache:", formData);
    caches
      .open(cacheName)
      .then((cache) => {
        cache
          .put("formData", new Response(JSON.stringify(formData)))
          .then(() => {
            console.log("Form data saved to cache.");
          })
          .catch((err) => {
            console.error("Error saving form data to cache:", err);
          });
      })
      .catch((err) => {
        console.error("Error opening cache:", err);
      });
  } else if (event.data && event.data.type === "GET_FORM_DATA") {
    console.log("Getting form data from cache.");
    event.waitUntil(
      caches
        .open(cacheName)
        .then((cache) => {
          return cache
            .match("formData")
            .then((response) => {
              return response ? response.json() : {};
            })
            .then((data) => {
              console.log("Form data loaded from cache:", data);
              event.ports[0].postMessage({
                type: "FORM_DATA",
                payload: data,
              });
            })
            .catch((err) => {
              console.error("Error getting form data from cache:", err);
            });
        })
        .catch((err) => {
          console.error("Error opening cache:", err);
        })
    );
  }
});
