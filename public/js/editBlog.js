class SimpleImage {
  static get toolbox() {
    return {
      title: 'Add information based on existing forms',
      icon: '<svg xmlns="http://www.w3.org/2000/svg" height="1em" viewBox="0 0 576 512"><!--! Font Awesome Free 6.4.2 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license (Commercial License) Copyright 2023 Fonticons, Inc. --><path d="M575.8 255.5c0 18-15 32.1-32 32.1h-32l.7 160.2c0 2.7-.2 5.4-.5 8.1V472c0 22.1-17.9 40-40 40H456c-1.1 0-2.2 0-3.3-.1c-1.4 .1-2.8 .1-4.2 .1H416 392c-22.1 0-40-17.9-40-40V448 384c0-17.7-14.3-32-32-32H256c-17.7 0-32 14.3-32 32v64 24c0 22.1-17.9 40-40 40H160 128.1c-1.5 0-3-.1-4.5-.2c-1.2 .1-2.4 .2-3.6 .2H104c-22.1 0-40-17.9-40-40V360c0-.9 0-1.9 .1-2.8V287.6H32c-18 0-32-14-32-32.1c0-9 3-17 10-24L266.4 8c7-7 15-8 22-8s15 2 21 7L564.8 231.5c8 7 12 15 11 24z"/></svg>'
    };
  }

  constructor({data}){
    this.data = data;
    // this.data = {
    //   url: data.url || '',
    //   caption: data.caption || '',
    //   withBorder: data.withBorder !== undefined ? data.withBorder : false,
    //   withBackground: data.withBackground !== undefined ? data.withBackground : false,
    //   stretched: data.stretched !== undefined ? data.stretched : false,
    // };
    this.wrapper = undefined;
    // this.settings = [
    //   {
    //     name: 'withBorder',
    //     icon: `<svg width="20" height="20" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path d="M15.8 10.592v2.043h2.35v2.138H15.8v2.232h-2.25v-2.232h-2.4v-2.138h2.4v-2.28h2.25v.237h1.15-1.15zM1.9 8.455v-3.42c0-1.154.985-2.09 2.2-2.09h4.2v2.137H4.15v3.373H1.9zm0 2.137h2.25v3.325H8.3v2.138H4.1c-1.215 0-2.2-.936-2.2-2.09v-3.373zm15.05-2.137H14.7V5.082h-4.15V2.945h4.2c1.215 0 2.2.936 2.2 2.09v3.42z"/></svg>`
    //   },
    //   {
    //     name: 'stretched',
    //     icon: `<svg width="17" height="10" viewBox="0 0 17 10" xmlns="http://www.w3.org/2000/svg"><path d="M13.568 5.925H4.056l1.703 1.703a1.125 1.125 0 0 1-1.59 1.591L.962 6.014A1.069 1.069 0 0 1 .588 4.26L4.38.469a1.069 1.069 0 0 1 1.512 1.511L4.084 3.787h9.606l-1.85-1.85a1.069 1.069 0 1 1 1.512-1.51l3.792 3.791a1.069 1.069 0 0 1-.475 1.788L13.514 9.16a1.125 1.125 0 0 1-1.59-1.591l1.644-1.644z"/></svg>`
    //   },
    //   {
    //     name: 'withBackground',
    //     icon: `<svg width="20" height="20" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path d="M10.043 8.265l3.183-3.183h-2.924L4.75 10.636v2.923l4.15-4.15v2.351l-2.158 2.159H8.9v2.137H4.7c-1.215 0-2.2-.936-2.2-2.09v-8.93c0-1.154.985-2.09 2.2-2.09h10.663l.033-.033.034.034c1.178.04 2.12.96 2.12 2.089v3.23H15.3V5.359l-2.906 2.906h-2.35zM7.951 5.082H4.75v3.201l3.201-3.2zm5.099 7.078v3.04h4.15v-3.04h-4.15zm-1.1-2.137h6.35c.635 0 1.15.489 1.15 1.092v5.13c0 .603-.515 1.092-1.15 1.092h-6.35c-.635 0-1.15-.489-1.15-1.092v-5.13c0-.603.515-1.092 1.15-1.092z"/></svg>`
    //   }
    // ];
  }

  render(){
    this.wrapper = document.createElement('div');

    // Title
    const titleInput = document.createElement('input');
    titleInput.classList.add('simple-image');
    titleInput.classList.add('title');
    titleInput.placeholder = "Enter Title...";
    titleInput.value = this.data.title || "";
    this.wrapper.appendChild(titleInput);

        // // Category
        // const categoryInput = document.createElement('input');
        // categoryInput.classList.add('simple-image');
        // categoryInput.classList.add('category');
        // categoryInput.placeholder = "Enter category...";
        // categoryInput.value = this.data.category || "";
        // this.wrapper.appendChild(categoryInput);

    // Category
    const categoryInput = document.createElement('select');
    categoryInput.classList.add('simple-image');
    categoryInput.setAttribute('id', 'category');
    
    // Tạo và thêm các option vào select
    const optionFood = document.createElement('option');
    optionFood.text = 'Food';
    optionFood.value = 'Food';
    categoryInput.appendChild(optionFood);
    
    const optionTravel = document.createElement('option');
    optionTravel.text = 'Travel';
    optionTravel.value = 'Travel';
    categoryInput.appendChild(optionTravel);

    const optionTechnology = document.createElement('option');
    optionTechnology.text = 'Technology';
    optionTechnology.value = 'Technology';
    categoryInput.appendChild(optionTechnology);

    const optionFashion = document.createElement('option');
    optionFashion.text = 'Fashion';
    optionFashion.value = 'Fashion';
    categoryInput.appendChild(optionFashion);

    const optionStyle = document.createElement('option');
    optionStyle.text = 'Style';
    optionStyle.value = 'Style';
    categoryInput.appendChild(optionStyle);

    this.wrapper.appendChild(categoryInput);

     // Date
     
     const dateInput = document.createElement('input');
     dateInput.classList.add('simple-image');
     dateInput.classList.add('time');
     dateInput.type = "datetime-local";
     dateInput.value = this.data.date || "";
     this.wrapper.appendChild(dateInput);

    // Image
    const imgURL = document.createElement('input');
    imgURL.classList.add('simple-image');
    imgURL.classList.add('img');
    imgURL.placeholder = 'Paste an image URL...';
    imgURL.value = this.data.image || "";
    imgURL.addEventListener('paste', (event) => {
      this._createImage(event.clipboardData.getData('text'));
    });
    this.wrapper.appendChild(imgURL);
    // Image container
    this.imageContainer = document.createElement("div");
    if (this.data.image) {
      this._createImage(this.data.image);
    }
    this.wrapper.appendChild(this.imageContainer);

    // Short content
    const shortContent = document.createElement('textarea');
    shortContent.classList.add('simple-image');
    shortContent.classList.add('shortContent');
    shortContent.placeholder = "Enter Short Content...";
    shortContent.value = this.data.shortContent || "";
    this.wrapper.appendChild(shortContent);

    // content
    const contentInput = document.createElement('textarea');
    contentInput.classList.add('simple-image');
    contentInput.classList.add('content');
    contentInput.placeholder = "Enter Content...";
    contentInput.value = this.data.content || "";
    contentInput.rows = 6; // Số hàng
    this.wrapper.appendChild(contentInput);

    // Author
     const authorInput = document.createElement('input');
     authorInput.classList.add('simple-image');
     contentInput.classList.add('author');
     authorInput.placeholder = "Enter Author...";
     authorInput.value = this.data.author || "";
     this.wrapper.appendChild(authorInput);


    // /////////////////////////////////
    return this.wrapper;
  }

    _createImage(url){
      this.imageContainer.innerHTML = ""; // clear any previous images

      if (url.trim() !== "") {
        const image = document.createElement("img");
        image.src = url;
        image.classList.add("simple-image");
        this.imageContainer.appendChild(image);
      }
    }
  
  save(blockContent){
      const titleValue = blockContent.querySelector(".title").value;
      const categoryValue = blockContent.querySelector('.category').value;
      const dateValue = document.querySelector(".time").value;
      const dateObject = new Date(dateValue);
      const shortContentValue = blockContent.querySelector(".shortContent").value;
      const contentValue = blockContent.querySelector(".content").value;
      const authorValue = blockContent.querySelector(".author").value;
      const imageUrlValue = blockContent.querySelector(".img").value;

      return {
        title: titleValue,
        category: categoryValue,
        date: dateObject,
        shortContent: shortContentValue,
        content: contentValue,
        author:authorValue,
        img: imageUrlValue,
        imgFooter: imageUrlValue,
      };
  }
  // validate(savedData){
  //   if (!savedData.url.trim()){
  //     return false;
  //   }
  //   return true;
  // }

  // Setting image
  // renderSettings(){
  //   const wrapper = document.createElement('div');

  //   this.settings.forEach( tune => {
  //     let button = document.createElement('div');

  //     button.classList.add('cdx-settings-button');
  //     button.innerHTML = tune.icon;
  //     wrapper.appendChild(button);

  //     button.addEventListener('click', () => {
  //       this._toggleTune(tune.name);
  //       button.classList.toggle('cdx-settings-button--active');
  //     });
  //   });

  //   return wrapper;
  // }
  //   /**
  //  * @private
  //  * Click on the Settings Button
  //  * @param {string} tune — tune name from this.settings
  //  */
  //   _toggleTune(tune) {
  //     this.data[tune] = !this.data[tune];
  //     this._acceptTuneView();
  //   }
  // /**
  //  * Add specified class corresponds with activated tunes
  //  * @private
  //  */
  // _acceptTuneView() {
  //   this.settings.forEach( tune => {
  //     this.wrapper.classList.toggle(tune.name, !!this.data[tune.name]);
  //   });
  // }  

}