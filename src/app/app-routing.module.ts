import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { AiComponent } from './ai/ai.component';
import { BoardComponent } from './board/board.component';
import { HomepageComponent } from './homepage/homepage.component';

const routes: Routes = [
  {
    path: '',
    component: HomepageComponent
  }, {
    path: 'one-player',
    component: AiComponent
  }, {
    path: 'two-player',
    component: BoardComponent
  }

];

@NgModule({
  imports: [RouterModule.forRoot(routes, { useHash: false})],
  exports: [RouterModule]
})
export class AppRoutingModule { }
