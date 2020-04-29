import { AfterViewInit, Component, ElementRef, HostListener, OnInit, Renderer2, ViewChild } from '@angular/core';
import { MatTable, MatTableDataSource, MatSort } from '@angular/material';
import { CdkDragStart, CdkDropList, moveItemInArray } from '@angular/cdk/drag-drop';

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
  @ViewChild(MatSort) sort: MatSort;

  availableColumns: any[] = [
    { field: 'position', width: 1,  },
    { field: 'name', width: 1, },
    { field: 'weight', width: 1, },
    { field: 'symbol', width: 1, }
  ];
  displayColumns: any[];
  displayedColumns: string[] = [];
  dataSource = new MatTableDataSource(ELEMENT_DATA);

  pressed = false;
  currentResizeIndex: number;
  startX: number;
  startWidth: number;
  isResizingRight: boolean;
  resizableMousemove: () => void;
  resizableMouseup: () => void;

  constructor(
    private renderer: Renderer2
  ) { }

  ngOnInit() {
    this.displayColumns = this.availableColumns;
    this.setDisplayedColumns();
    this.dataSource.sort = this.sort;
  }

  ngAfterViewInit() {
    this.setTableResize(this.matTableRef.nativeElement.clientWidth);
  }

  onColumnSelect() {
    this.setDisplayedColumns();
    // console.info('tableWidth', this.matTableRef.nativeElement.clientWidth);
    setTimeout( _ => {
      const tableWidth = this.matTableRef.nativeElement.clientWidth;
      // console.info('tableWidth', tableWidth);
        this.setTableResize(tableWidth);
    }, 1);
  }

  previousIndex: number;
  dragStarted(event: CdkDragStart, index: number ) {
    this.previousIndex = index;
  }

  dropListDropped(event: CdkDropList, index: number) {
    if (event) {
      const prevField = this.availableColumns[this.previousIndex];
      const nextField = this.availableColumns[index];
      moveItemInArray(this.availableColumns, this.previousIndex, index);
      moveItemInArray(this.displayColumns
        , this.displayColumns.indexOf(prevField)
        , this.displayColumns.indexOf(nextField));

      this.onColumnSelect();
    }
  }

  setTableResize(tableWidth: number) {
    let totWidth = 0;
    this.displayColumns.forEach(( column) => {
      totWidth += column.width;
    });
    const scale = (tableWidth - 5) / totWidth;
    this.displayColumns.forEach(( column) => {
      column.width *= scale;
      this.setColumnWidth(column);
    });
  }

  setDisplayedColumns() {
    this.displayedColumns = this.displayColumns.map( c => c.field );
  }

  onResizeColumn(event: any, indexA: number) {
    // console.info('indexA', indexA);
    const index = this.displayColumns.indexOf(this.availableColumns[indexA]);
    // console.info('index', index);
    this.checkResizing(event, index);
    this.currentResizeIndex = index;
    this.pressed = true;
    this.startX = event.pageX;
    this.startWidth = event.target.clientWidth;
    event.preventDefault();
    this.mouseMove(index);
  }

  private checkResizing(event, index) {
    const cellData = this.getCellData(index);
    // console.info('checkResizing:', cellData);
    // console.info('index:', index, 'this.availableColumns.length:', this.displayColumns.length);
    if ( ( index === 0 ) || ( Math.abs(event.pageX - cellData.right) < cellData.width / 2 &&  index !== this.displayColumns.length - 1 ) ) {
      this.isResizingRight = true;
    } else {
      this.isResizingRight = false;
    }
  }

  private getCellData(index: number) {
    const headerRow = this.matTableRef.nativeElement.children[0];
    // console.info('getCellData', headerRow);
    const cell = headerRow.children[index];
    return cell.getBoundingClientRect();
  }

  mouseMove(index: number) {
    this.resizableMousemove = this.renderer.listen('document', 'mousemove', (event) => {
      if (this.pressed && event.buttons ) {
        const dx = (this.isResizingRight) ? (event.pageX - this.startX) : (-event.pageX + this.startX);
        const width = this.startWidth + dx;
        if ( this.currentResizeIndex === index && width > 50 ) {
          this.setColumnWidthChanges(index, width);
        }
      }
    });
    this.resizableMouseup = this.renderer.listen('document', 'mouseup', (event) => {
      if (this.pressed) {
        this.pressed = false;
        this.currentResizeIndex = -1;
        this.resizableMousemove();
        this.resizableMouseup();
        // console.info('avail:', this.availableColumns);
        // console.info('disp:', this.displayColumns);
      }
    });
  }

  setColumnWidthChanges(index: number, width: number) {
    const orgWidth = this.displayColumns[index].width;
    const dx = width - orgWidth;
    if ( dx !== 0 ) {
      const j = ( this.isResizingRight ) ? index + 1 : index - 1;
      const newWidth = this.displayColumns[j].width - dx;
      if ( newWidth > 50 ) {
          this.displayColumns[index].width = width;
          this.setColumnWidth(this.displayColumns[index]);
          this.displayColumns[j].width = newWidth;
          this.setColumnWidth(this.displayColumns[j]);
        }
    }
  }

  setColumnWidth(column: any) {
    const matColDef = column.field.replace(/\W/g, '-'); // allow for spaces, special chars in matColumnDef
    // console.info('matColDef:', matColDef);
    const columnEls = Array.from(document.getElementsByClassName(`mat-column-${column.field}`));
    columnEls.forEach(( el: HTMLDivElement ) => {
      // use Rederer2 object to manipulate DOM
      this.renderer.setStyle(el, 'width', `${column.width}px`);
      //el.style.width = column.width + 'px';
    });
  }

  @HostListener('window:resize', ['$event'])
  onResize(event) {
    this.onColumnSelect();
    // setTimeout( _ => {
    //   this.setTableResize(this.matTableRef.nativeElement.clientWidth);
    // }, 10);
  }
}
