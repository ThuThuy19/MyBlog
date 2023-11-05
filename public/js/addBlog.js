class SimpleImage {
  static get toolbox() {
    return {
      title: "Add information based on existing forms",
      icon: '<svg xmlns="http://www.w3.org/2000/svg" height="1em" viewBox="0 0 576 512"><!--! Font Awesome Free 6.4.2 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license (Commercial License) Copyright 2023 Fonticons, Inc. --><path d="M575.8 255.5c0 18-15 32.1-32 32.1h-32l.7 160.2c0 2.7-.2 5.4-.5 8.1V472c0 22.1-17.9 40-40 40H456c-1.1 0-2.2 0-3.3-.1c-1.4 .1-2.8 .1-4.2 .1H416 392c-22.1 0-40-17.9-40-40V448 384c0-17.7-14.3-32-32-32H256c-17.7 0-32 14.3-32 32v64 24c0 22.1-17.9 40-40 40H160 128.1c-1.5 0-3-.1-4.5-.2c-1.2 .1-2.4 .2-3.6 .2H104c-22.1 0-40-17.9-40-40V360c0-.9 0-1.9 .1-2.8V287.6H32c-18 0-32-14-32-32.1c0-9 3-17 10-24L266.4 8c7-7 15-8 22-8s15 2 21 7L564.8 231.5c8 7 12 15 11 24z"/></svg>',
    };
  }

  constructor({ data }) {
    this.data = data;
    this.wrapper = undefined;
  }

  render() {
    this.wrapper = document.createElement("div");

    // Title
    const titleInput = document.createElement("input");
    titleInput.classList.add("simple-image");
    titleInput.classList.add("title");
    titleInput.placeholder = "Enter Title...";
    titleInput.value = this.data.title || "";
    this.wrapper.appendChild(titleInput);

    // Category
    const categoryInput = document.createElement("input");
    categoryInput.classList.add("simple-image");
    categoryInput.classList.add("categories");
    categoryInput.placeholder = "Enter category...";
    categoryInput.value = this.data.category || "";
    this.wrapper.appendChild(categoryInput);

    // Date
    const dateInput = document.createElement("input");
    dateInput.classList.add("simple-image");
    dateInput.classList.add("time");
    dateInput.type = "datetime-local";
    dateInput.value = this.data.date || "";
    this.wrapper.appendChild(dateInput);

    // Image
    const imgURL = document.createElement("input");
    imgURL.classList.add("simple-image");
    imgURL.classList.add("img");
    imgURL.placeholder = "Paste an image URL...";
    imgURL.value = this.data.image || "";
    imgURL.addEventListener("paste", (event) => {
      this._createImage(event.clipboardData.getData("text"));
    });
    this.wrapper.appendChild(imgURL);

    // Image container
    this.imageContainer = document.createElement("div");
    if (this.data.image) {
      this._createImage(this.data.image);
    }
    this.wrapper.appendChild(this.imageContainer);

    // Short content
    const shortContent = document.createElement("textarea");
    shortContent.classList.add("simple-image");
    shortContent.classList.add("shortContent");
    shortContent.placeholder = "Enter Short Content...";
    shortContent.value = this.data.shortContent || "";
    this.wrapper.appendChild(shortContent);

    // content
    const contentInput = document.createElement("textarea");
    contentInput.classList.add("simple-image");
    contentInput.classList.add("content");
    contentInput.placeholder = "Enter Content...";
    contentInput.value = this.data.content || "";
    contentInput.rows = 6; 
    this.wrapper.appendChild(contentInput);

    // Author
    const authorInput = document.createElement("input");
    authorInput.classList.add("simple-image");
    contentInput.classList.add("author");
    authorInput.placeholder = "Enter Author...";
    authorInput.value = this.data.author || "";
    this.wrapper.appendChild(authorInput);

    return this.wrapper;
  }

  _createImage(url) {
    this.imageContainer.innerHTML = ""; // clear any previous images
    if (url.trim() !== "") {
      const image = document.createElement("img");
      image.src = url;
      image.classList.add("simple-image");
      this.imageContainer.appendChild(image);
    }
  }

  save(blockContent) {
    const titleValue = blockContent.querySelector(".title").value;
    const categoryValue = blockContent.querySelector(".categories").value;
    const dateValue = document.querySelector(".time").value;
    const dateObject = new Date(dateValue);
    const shortContentValue = blockContent.querySelector(".shortContent").value;
    const contentValue = blockContent.querySelector(".content").value;
    const authorValue = blockContent.querySelector(".author").value;
    const imageUrlValue = blockContent.querySelector(".img").value;

    const caption = blockContent.querySelector('[contenteditable]');

    return {
      title: titleValue,
      category: categoryValue,
      date: dateObject,
      shortContent: shortContentValue,
      content: contentValue,
      author: authorValue,
      img: imageUrlValue,
      imgFooter: imageUrlValue,

      caption: caption.innerHTML || ''
    };
  }
  // validate(savedData){
  //   if (!savedData.url.trim()){
  //     return false;
  //   } 
  //   return true;
  // }
}
