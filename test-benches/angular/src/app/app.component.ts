import { Component, OnInit } from '@angular/core';
import { ObservableService } from './observable.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent implements OnInit {
  title = 'angular';

  intervalIndex: number | undefined = undefined;

  constructor(private observableService: ObservableService) {}

  ngOnInit(): void {
    this.observableService.getObservable().subscribe((i) => (this.intervalIndex = i));
  }
}
