import { AfterViewInit, Component, ElementRef, HostListener, OnInit, Renderer2, ViewChild } from '@angular/core';

import {
  MatTable,
  MatTableDataSource,
  MatSort,
  MatPaginator,
  MatDialog,
  MatColumnDef,
  MatCellDef,
  MatDialogConfig
} from '@angular/material';


export interface PeriodicElement {
  name: string;
  position: number;
  weight: number;
  symbol: string;
}

const ELEMENT_DATA: PeriodicElement[] = [
  {position: 1, name: 'Hydrogen', weight: 1.0079, symbol: 'H'},
  {position: 2, name: 'Helium', weight: 4.0026, symbol: 'He'},
  {position: 3, name: 'Lithium', weight: 6.941, symbol: 'Li'},
  {position: 4, name: 'Beryllium', weight: 9.0122, symbol: 'Be'},
  {position: 5, name: 'Boron', weight: 10.811, symbol: 'B'},
  {position: 6, name: 'Carbon', weight: 12.0107, symbol: 'C'},
  {position: 7, name: 'Nitrogen', weight: 14.0067, symbol: 'N'},
  {position: 8, name: 'Oxygen', weight: 15.9994, symbol: 'O'},
  {position: 9, name: 'Fluorine', weight: 18.9984, symbol: 'F'},
  {position: 10, name: 'Neon', weight: 20.1797, symbol: 'Ne'},
];

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit, AfterViewInit {
  title = 'Material Table column Resize';

  @ViewChild(MatTable, {read: ElementRef} ) private matTableRef: ElementRef;

  columns: any[] = [
    { field: 'position', width: 100,  },
    { field: 'name', width: 350, },
    { field: 'weight', width: 250, },
    { field: 'symbol', width: 100, }
  ];
  displayedColumns: string[] = [];
  dataSource = ELEMENT_DATA;

  pressed = false;
  currentResizeIndex: number;
  startX: number;
  startWidth: number;
  resizableMousemove: () => void;
  resizableMouseup: () => void;

  constructor(
    private el: ElementRef,
    private renderer: Renderer2
  ) { }

  ngOnInit() {
    this.setDisplayedColumns();
  }

  ngAfterViewInit() {
    this.setTableResize(this.matTableRef.nativeElement.clientWidth);
  }

  setTableResize(tableWidth) {
    let totWidth = 0;
    this.columns.forEach(( column) => {
      totWidth += column.width;
      this.setColumnWidth(column, column.width);
    });
    const scale = (tableWidth - 5) / totWidth;
    this.columns.forEach(( column) => {
      column.width *= scale;
      this.setColumnWidth(column, column.width);
    });
  }

  setDisplayedColumns() {
    this.columns.forEach(( column, index) => {
      column.index = index;
      this.displayedColumns[index] = column.field;
    });
  }

  onResizeColumn(event: any, column, index: number) {
    if ( index < this.columns.length - 1 ) { // last column is not allow to resize, but can be resized by previous column
      this.currentResizeIndex = index;
      this.pressed = true;
      this.startX = event.pageX;
      this.startWidth = event.target.clientWidth;
      this.mouseMove(column, index);
    }
  }

  mouseMove(column: any, index) {
    this.resizableMousemove = this.renderer.listen('document', 'mousemove', (event) => {
      if (this.pressed) {
        const width = this.startWidth + (event.pageX - this.startX);
        if ( this.currentResizeIndex === index && width > 50 ) { // TODO need define min Width for each column???
          this.setColumnWidthChanges(column, index, width);
        }
      }
    });
    this.resizableMouseup = this.renderer.listen('document', 'mouseup', (event) => {
      if (this.pressed) {
        this.pressed = false;
        this.resizableMousemove();
        this.resizableMouseup();
      }
    });
  }
  setColumnWidthChanges(column, index, width) {
    const orgWidth = column.width;
    const dx = width - orgWidth;
    if ( dx !== 0 ) {
      const j = index + 1;
      const newWidth = this.columns[j].width - dx;
      if ( newWidth > 50 ) { // TODO need define min Width for each column???
        this.columns[index].width = width;
        this.setColumnWidth(column, width);
        this.columns[j].width = newWidth;
        this.setColumnWidth(this.columns[j], newWidth);
      }
    }
  }

  setColumnWidth(column, width: number) {
    const widthpx = width + 'px';
    const columnEls = document.getElementsByClassName('mat-column-' + column.field);
    // tslint:disable-next-line: prefer-for-of
    for (let i = 0; i < columnEls.length; i++) {
      const el = columnEls[i] as HTMLDivElement;
      el.style.width = widthpx;
    }
  }

  @HostListener('window:resize', ['$event'])
  onResize(event) {
    this.setTableResize(this.matTableRef.nativeElement.clientWidth);
  }
}
