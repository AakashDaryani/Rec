import { LightningElement, api } from 'lwc';

export default class Pagination extends LightningElement {
    @api pageSize;
    totalrecordscount = 0;
    pageList = [];
    @api clickedPage = 1;
    totalpages = 0;

    connectedCallback() {
        if (this.totalrecordscount && this.pageSize) {
            this.totalpages = Math.ceil(Number(this.totalrecordscount) / Number(this.pageSize));
            this.updatePageList();
        }
    }

    renderedCallback() {
        this.changeColorOnClick();
    }

    changeColorOnClick() {
        this.template.querySelectorAll('lightning-button').forEach(e => {
            if (Number(e.label) === this.clickedPage) {
                e.classList.add('currentpage');
                e.blur();
            } else {
                e.classList.remove('currentpage');
            }
        });
    }

    @api
    get totalrecords() {
        return this.totalrecordscount;
    }

    set totalrecords(value) {
        this.totalrecordscount = value;
        this.connectedCallback();
    }

    @api
    resetThePage() {
        this.clickedPage = 1;
    }
    
    get startrange() {
        return (((this.clickedPage - 1) * this.pageSize) + 1);
    }

    get endrange() {
        return ((this.pageSize * this.clickedPage));
    }

    get disableleftarrow() {
        return (this.clickedPage === 1)
    }

    get disablerightarrow() {
        return (this.clickedPage === this.totalpages);
    }

    handlePrevious(event) {
        if (this.clickedPage > 1) {
            this.clickedPage = this.clickedPage - 1;
            this.dispatchPaginationevent();
            this.updatePageList();
        }
    }

    @api 
    getClickedPage(){
        return this.clickedPage;
    }

    handleNext(event) {
        if (this.clickedPage < this.totalpages) {
            this.clickedPage = this.clickedPage + 1;
            this.dispatchPaginationevent();
            this.updatePageList();
        }
    }

    @api
    handleClick(event) {
        if (event.target.label != '...') {
            this.clickedPage = Number(event.target.label);
            this.dispatchPaginationevent();
            this.updatePageList();
        }
    }

    updatePageList() {
        if (this.totalpages <= 4) {
            this.pageList = Array.from({ length: this.totalpages }, (v, k) => k + 1);
        } else if (this.clickedPage <= 2) {
            this.pageList = [1, 2, 3, 4, '...'];
        } else if (this.clickedPage >= this.totalpages - 1) {
            this.pageList = ['...', this.totalpages - 3, this.totalpages - 2, this.totalpages - 1, this.totalpages];
        } else {
            this.pageList = ['...', this.clickedPage - 1, this.clickedPage, this.clickedPage + 1, '...',];
        }
        this.pageList = [...this.pageList];
    }

    dispatchPaginationevent() {
        this.dispatchEvent(new CustomEvent('pagination', {
            detail: this.clickedPage,
            bubbles: true,
            composed: true
        }));
    }
}