import { ChangeDetectorRef } from '@angular/core';
import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  ViewEncapsulation,
} from '@angular/core';
import { CalendarEvent, CalendarEventTitleFormatter } from 'angular-calendar';
import { WeekViewHourSegment } from 'calendar-utils';
import { addDays, addMinutes, endOfWeek } from 'date-fns';
import { fromEvent } from 'rxjs';
import { finalize, takeUntil } from 'rxjs/operators';

function floorToNearest(amount: number, precision: number) {
  return Math.floor(amount / precision) * precision;
}

function ceilToNearest(amount: number, precision: number) {
  return Math.ceil(amount / precision) * precision;
}

@Component({
  selector: 'app-drag-comp',
  templateUrl: './drag-comp.component.html',
  styleUrls: ['./drag-comp.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: CalendarEventTitleFormatter,
    },
  ],
  encapsulation: ViewEncapsulation.None,
})
export class DragCompComponent implements OnInit {
  viewDate = new Date();
  weekStartsOn: 0 = 0;
  dragToCreateActive = false;
  events: CalendarEvent[] = [];
  days: any[] = [];
  slots: any[] = [];
  constructor(private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.initDays();
  }

  initDays() {
    this.days = [
      'Sunday',
      'Monday',
      'Tuesday',
      'Wednesday',
      'Thursday',
      'Friday',
      'Saturday',
    ];
    for (let i = 0; i < this.days.length; i++) {
      // let a = {};
      // a[this.days[i]] = [];
      // this.slots.push(a);

      let a = { day: this.days[i], time: [] };
      this.slots.push(a);
    }
  }

  startDragToCreate(
    segment: WeekViewHourSegment,
    mouseDownEvent: MouseEvent,
    segmentElement: HTMLElement
  ) {
    const dragToSelectEvent: CalendarEvent = {
      id: this.events.length,
      title: 'New slot',
      start: segment.date,
      meta: {
        tmpEvent: true,
      },
      actions: [
        {
          label: '<i class="fas fa-fw fa-trash-alt trash-icon"></i>',
          onClick: ({ event }: { event: CalendarEvent }): void => {
            this.events = this.events.filter((iEvent) => iEvent !== event);
            this.removeSlot(event.id);
          },
        },
      ],
    };
    this.events = [...this.events, dragToSelectEvent];
    console.log('event', this.events);

    const segmentPosition = segmentElement.getBoundingClientRect();
    this.dragToCreateActive = true;
    const endOfView = endOfWeek(this.viewDate, {
      weekStartsOn: this.weekStartsOn,
    });

    fromEvent(document, 'mousemove')
      .pipe(
        finalize(() => {
          delete dragToSelectEvent.meta.tmpEvent;
          this.dragToCreateActive = false;
          this.refresh();
        }),
        takeUntil(fromEvent(document, 'mouseup'))
      )
      .subscribe((mouseMoveEvent: MouseEvent) => {
        const minutesDiff = ceilToNearest(
          mouseMoveEvent.clientY - segmentPosition.top,
          30
        );

        const daysDiff =
          floorToNearest(
            mouseMoveEvent.clientX - segmentPosition.left,
            segmentPosition.width
          ) / segmentPosition.width;

        const newEnd = addDays(addMinutes(segment.date, minutesDiff), daysDiff);
        if (newEnd > segment.date && newEnd < endOfView) {
          dragToSelectEvent.end = newEnd;
        }
        this.refresh();
      });
  }

  private refresh() {
    this.events = [...this.events];
    this.cdr.detectChanges();
    this.getSlots();
  }

  convertTime(t) {
    return new Date(t).toTimeString();
  }

  convertDay(d) {
    return new Date(d).toLocaleString('en-us', {
      weekday: 'long',
    });
  }

  getSlots() {
    // let st, et, t;
    // for (let i = 0; i < this.events.length; i++) {
    //   for (let j = 0; j < this.slots.length; j++) {
    //     st = this.convertTime(this.events[i].start);
    //     et = this.convertTime(this.events[i].end);

    //     if (this.convertDay(this.events[i].start) === this.slots[j].day) {
    //       if (et === 'Invalid Date') {
    //         let delay = new Date(this.events[i].start);
    //         delay.setMinutes(delay.getMinutes() + 30);
    //         et = this.convertTime(delay);
    //         t = {
    //           startTime: st,
    //           endTime: et,
    //           id: this.events[i].id,
    //         };
    //       } else {
    //         t = {
    //           startTime: st,
    //           endTime: et,
    //           id: this.events[i].id,
    //         };
    //       }

    //       this.slots[j].time.push(t);

    //       let mymap = new Map();
    //       let unique = this.slots[j].time.filter((el) => {
    //         const val = mymap.get(el.startTime);
    //         if (val) {
    //           if (el.endTime > val) {
    //             mymap.delete(el.startTime);
    //             mymap.set(el.startTime, el.endTime);
    //             return true;
    //           } else {
    //             return false;
    //           }
    //         }
    //         mymap.set(el.startTime, el.endTime);
    //         return true;
    //       });
    //       this.slots[j].time = unique;
    //     }
    //   }
    // }
    // console.log(this.slots);

    this.events.forEach((e) => {
      console.log('e', e);
      this.slots.map((day, i) => {
        if (day.day == this.convertDay(e.start)) {
          this.slots[i].time.push({
            startTime: e.start,
            endTime: e.end,
            id: e.id,
          });
        }
      });
    });
    console.log(this.slots);
  }

  removeSlot(id) {
    for (let j = 0; j < this.slots.length; j++) {
      this.slots[j].time = this.slots[j].time.filter((t) => t.id !== id);
    }
  }
}
